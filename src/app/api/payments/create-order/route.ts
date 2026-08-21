import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/server/firebase-admin";
import { computeAuthoritativeOrderPrice, AUTHORITATIVE_ADDONS } from "@/lib/server/pricingCatalog";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CreateOrderSchema = z.object({
  planId: z.string().min(1).max(50),
  addonIds: z.array(z.string().max(50)).optional().default([]),
  couponCode: z.string().max(50).optional().nullable(),
  formData: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(150),
    company: z.string().max(100).optional().default(""),
    projectType: z.string().max(100).optional(),
    timeline: z.string().max(50).optional().default("Within 2 weeks"),
    details: z.string().max(2000).optional().default(""),
  }),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: "Order engine is temporarily unavailable. Missing backend configuration." },
        { status: 503 }
      );
    }

    const rawBody = await req.json();
    const parseResult = CreateOrderSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload. Please verify required fields.", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { planId, addonIds, couponCode, formData } = parseResult.data;
    const userEmail = formData.email.trim().toLowerCase();

    // 1. Authoritative Pricing Calculation (Client price inputs are completely ignored)
    let calculated;
    try {
      calculated = computeAuthoritativeOrderPrice(planId, addonIds);
    } catch (priceErr: any) {
      return NextResponse.json(
        { success: false, error: priceErr.message || "Invalid package or add-on selected." },
        { status: 400 }
      );
    }

    const { plan, rawTotal } = calculated;

    // 2. Authentication & Safe Account Provisioning (SEC-008 Fix)
    // Extract optional Bearer token if user is already authenticated
    let authenticatedUid: string | null = null;
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ") && adminAuth) {
      try {
        const token = authHeader.split("Bearer ")[1].trim();
        const decoded = await adminAuth.verifyIdToken(token);
        authenticatedUid = decoded.uid;
      } catch (authErr) {
        // Unauthenticated guest checkout
      }
    }

    let finalUserId = authenticatedUid || "";
    let customAuthToken: string | null = null;

    if (!finalUserId && adminAuth) {
      try {
        // Check if account already exists
        let existingUser = null;
        try {
          existingUser = await adminAuth.getUserByEmail(userEmail);
        } catch (e: any) {
          if (e.code !== "auth/user-not-found") {
            console.error("Auth check error:", e);
          }
        }

        if (existingUser) {
          // SEC-008: Account exists — DO NOT mint a token for unauthenticated request
          finalUserId = existingUser.uid;
        } else {
          // Account does not exist — safely create new customer account
          const newUser = await adminAuth.createUser({
            email: userEmail,
            displayName: formData.name.trim(),
            emailVerified: false,
          });

          finalUserId = newUser.uid;
          await adminDb.collection("users").doc(newUser.uid).set({
            name: formData.name.trim(),
            email: userEmail,
            role: "user",
            company: formData.company || "",
            activeProjectCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          // Mint custom token exclusively for the newly created user session
          customAuthToken = await adminAuth.createCustomToken(newUser.uid);
        }
      } catch (userProvisionErr) {
        console.error("Account provisioning note:", userProvisionErr);
      }
    }

    if (!finalUserId) {
      finalUserId = "GUEST_" + Date.now();
    }

    // 3. Two-Phase Atomic Coupon Validation & Reservation
    let appliedTotalPrice = rawTotal;
    let couponData: {
      couponId: string;
      code: string;
      type: string;
      value: number;
      discountAmount: number;
      scope: string;
    } | null = null;

    if (couponCode && couponCode.trim()) {
      const cleanCouponCode = couponCode.toUpperCase().trim();

      try {
        const couponResult = await adminDb.runTransaction(async (transaction) => {
          const couponQuery = await adminDb!
            .collection("coupons")
            .where("code", "==", cleanCouponCode)
            .limit(1)
            .get();

          if (couponQuery.empty) {
            throw new Error("Invalid promo code.");
          }

          const couponDoc = couponQuery.docs[0];
          const couponRef = couponDoc.ref;
          const freshSnap = await transaction.get(couponRef);

          if (!freshSnap.exists) {
            throw new Error("Promo code not found.");
          }

          const freshCoupon = freshSnap.data()!;

          if (!freshCoupon.isActive) {
            throw new Error("This promo code is no longer active.");
          }

          const now = Date.now();
          if (freshCoupon.startDate && now < new Date(freshCoupon.startDate).getTime()) {
            throw new Error("This promo code has not started yet.");
          }
          if (freshCoupon.endDate && now > new Date(freshCoupon.endDate).getTime()) {
            throw new Error("This promo code has expired.");
          }

          const scope = freshCoupon.scope || "all";
          if (scope === "maintenance") {
            throw new Error("This promo code is exclusively for Website Maintenance Retainers.");
          }

          // Concurrency check: usedCount + pendingReservations < usageLimit
          const usedCount = freshCoupon.usedCount || 0;
          const pendingReservations = freshCoupon.pendingReservations || 0;
          if (freshCoupon.usageLimit > 0 && usedCount + pendingReservations >= freshCoupon.usageLimit) {
            throw new Error("This promo code has reached its maximum usage limit.");
          }

          // Same-user reuse check
          const userIdentifier = finalUserId || userEmail;
          if (freshCoupon.usedByUsers && freshCoupon.usedByUsers.includes(userIdentifier)) {
            throw new Error("You have already used this promo code.");
          }

          // Scope calculation
          let discountBaseAmount = rawTotal;
          if (scope === "addons") {
            const applicableAddons: string[] = freshCoupon.applicableAddons || ["all"];
            const matchingAddons = applicableAddons.includes("all")
              ? addonIds
              : addonIds.filter((a) => applicableAddons.includes(a));

            discountBaseAmount = matchingAddons.reduce((sum, aId) => sum + (AUTHORITATIVE_ADDONS[aId]?.price || 0), 0);
            if (matchingAddons.length === 0) {
              throw new Error("This promo code applies only to selected add-on boosters.");
            }
          }

          if (scope === "plans") {
            const applicablePlans: string[] = freshCoupon.applicablePlans || ["all"];
            if (!applicablePlans.includes("all") && !applicablePlans.includes(planId.toLowerCase())) {
              throw new Error(`This promo code is not valid for the ${plan.name} package.`);
            }
          }

          if (freshCoupon.minOrderValue && rawTotal < freshCoupon.minOrderValue) {
            throw new Error(`Minimum project value of ₹${freshCoupon.minOrderValue.toLocaleString()} required for this promo code.`);
          }

          let discount = 0;
          if (freshCoupon.type === "percentage") {
            discount = Math.round(discountBaseAmount * (freshCoupon.value / 100));
            if (freshCoupon.maxDiscount && freshCoupon.maxDiscount > 0) {
              discount = Math.min(discount, freshCoupon.maxDiscount);
            }
          } else {
            discount = Math.min(freshCoupon.value, discountBaseAmount);
          }

          discount = Math.min(discount, rawTotal);

          // Phase 1 Atomic Reservation: increment pendingReservations
          transaction.update(couponRef, {
            pendingReservations: pendingReservations + 1,
            updatedAt: new Date().toISOString(),
          });

          return {
            couponId: couponDoc.id,
            code: freshCoupon.code,
            type: freshCoupon.type as string,
            value: freshCoupon.value as number,
            discountAmount: discount,
            scope,
          };
        });

        couponData = couponResult;
        appliedTotalPrice = rawTotal - couponResult.discountAmount;
      } catch (couponErr: any) {
        return NextResponse.json(
          { success: false, error: couponErr.message || "Promo code validation failed." },
          { status: 400 }
        );
      }
    }

    // 4. Server-Authoritative 50/50 Advance & Final Split Calculation
    const calculatedAdvance = Math.round(appliedTotalPrice * 0.5);
    const calculatedFinal = appliedTotalPrice - calculatedAdvance;

    const orderData: Record<string, any> = {
      userId: finalUserId,
      userEmail,
      planId: plan.id,
      planName: plan.name,
      originalTotalPrice: rawTotal,
      totalPrice: appliedTotalPrice,
      advancePrice: calculatedAdvance,
      advancePaid: false,
      finalPrice: calculatedFinal,
      finalPaid: false,
      currency: "₹",
      status: "awaiting_advance",
      formData: {
        name: formData.name.trim(),
        email: userEmail,
        company: formData.company || "",
        projectType: formData.projectType || plan.name,
        timeline: formData.timeline,
        details: formData.details,
        addons: addonIds,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (couponData) {
      orderData.couponCode = couponData.code;
      orderData.couponId = couponData.couponId;
      orderData.discountType = couponData.type;
      orderData.discountValue = couponData.value;
      orderData.discountAmount = couponData.discountAmount;
      orderData.discountScope = couponData.scope;
      orderData.couponReservedAt = new Date().toISOString();
    }

    const docRef = await adminDb.collection("orders").add(orderData);
    const orderId = docRef.id;

    // Create server-side notification for operations team
    await adminDb.collection("notifications").add({
      title: `New Project Booking: ${plan.name}`,
      message: `${formData.name} (${userEmail}) configured a ${plan.name} build (Total: ₹${appliedTotalPrice.toLocaleString()}, 50% Advance: ₹${calculatedAdvance.toLocaleString()}).`,
      targetType: "admin_dev",
      targetRoles: ["admin", "super_admin", "developer"],
      senderName: "Booking Engine",
      senderRole: "System",
      createdAt: new Date().toISOString(),
      readBy: [],
      clearedBy: [],
    });

    await logSecurityEvent({
      action: "order:create",
      actorUid: finalUserId,
      actorEmail: userEmail,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { planId, appliedTotalPrice, calculatedAdvance, hasCoupon: !!couponData },
    });

    return NextResponse.json({
      success: true,
      orderId,
      totalPrice: appliedTotalPrice,
      originalTotalPrice: rawTotal,
      advancePrice: calculatedAdvance,
      finalPrice: calculatedFinal,
      customAuthToken,
      userId: finalUserId,
      couponApplied: couponData
        ? {
            code: couponData.code,
            discountAmount: couponData.discountAmount,
            type: couponData.type,
            value: couponData.value,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Create order critical failure:", error);
    await logSecurityEvent({
      action: "order:create",
      status: "failed",
      ip: clientIp,
      reason: error?.message || "Internal error",
    });

    return NextResponse.json(
      { success: false, error: "Failed to create project booking. Please try again or contact support." },
      { status: 500 }
    );
  }
}
