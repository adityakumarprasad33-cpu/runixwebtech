import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/server/firebase-admin";

const ADDON_PRICES: Record<string, number> = {
  "addon-express": 2500,
  "addon-seo": 2000,
  "addon-cms": 3500,
  "addon-paytm": 4000,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      planName,
      totalPrice: clientTotalPrice,
      advancePrice,
      finalPrice,
      formData,
      userId: passedUserId,
      userEmail: passedUserEmail,
      couponCode: clientCouponCode,
    } = body;

    if (!planName || !clientTotalPrice || !formData?.name || !formData?.email) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required project information." },
        { status: 400 }
      );
    }

    let finalUserId = passedUserId || "";
    let finalUserEmail = passedUserEmail || formData.email.trim().toLowerCase();
    let customAuthToken: string | null = null;

    // If client is a guest (not authenticated yet), provision or fetch account seamlessly
    if (!finalUserId && adminAuth) {
      try {
        let userRecord;
        try {
          userRecord = await adminAuth.getUserByEmail(finalUserEmail);
        } catch (e: any) {
          if (e.code === "auth/user-not-found") {
            // Create user account seamlessly
            userRecord = await adminAuth.createUser({
              email: finalUserEmail,
              displayName: formData.name.trim(),
              emailVerified: false,
            });

            // Store user document in Firestore
            if (adminDb) {
              await adminDb.collection("users").doc(userRecord.uid).set({
                name: formData.name.trim(),
                email: finalUserEmail,
                role: "user",
                company: formData.company || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          } else {
            throw e;
          }
        }

        finalUserId = userRecord.uid;
        // Generate custom token so client can auto-sign-in on the frontend
        customAuthToken = await adminAuth.createCustomToken(userRecord.uid);
      } catch (authErr) {
        console.error("Auto account creation notice:", authErr);
      }
    }

    // ── Coupon Validation & Atomic Redemption ──
    let appliedTotalPrice = Number(clientTotalPrice);
    let originalTotalPrice = appliedTotalPrice;
    let couponData: {
      couponId: string;
      code: string;
      type: string;
      value: number;
      discountAmount: number;
      scope?: string;
    } | null = null;

    if (clientCouponCode && adminDb) {
      try {
        const couponResult = await adminDb.runTransaction(async (transaction) => {
          // 1. Query coupon by code
          const couponQuery = await adminDb!
            .collection("coupons")
            .where("code", "==", clientCouponCode.toUpperCase().trim())
            .limit(1)
            .get();

          if (couponQuery.empty) {
            throw new Error("Invalid coupon code. Please check and try again.");
          }

          const couponDoc = couponQuery.docs[0];
          const couponRef = couponDoc.ref;

          // 2. Re-read inside transaction for consistency (prevents race conditions)
          const freshSnap = await transaction.get(couponRef);
          if (!freshSnap.exists) {
            throw new Error("Coupon not found.");
          }
          const freshCoupon = freshSnap.data()!;

          // 3. Validate coupon
          if (!freshCoupon.isActive) {
            throw new Error("This coupon is no longer active.");
          }

          const now = Date.now();
          if (freshCoupon.startDate && now < new Date(freshCoupon.startDate).getTime()) {
            throw new Error("This coupon is not yet active.");
          }
          if (freshCoupon.endDate && now > new Date(freshCoupon.endDate).getTime()) {
            throw new Error("This coupon has expired.");
          }

          // Scope check: Maintenance coupons cannot be used for project build orders
          const scope = freshCoupon.scope || "all";
          if (scope === "maintenance") {
            throw new Error("This promo code is exclusively valid for Website Maintenance Retainers.");
          }

          // Usage limit check (0 = unlimited)
          if (freshCoupon.usageLimit > 0 && (freshCoupon.usedCount || 0) >= freshCoupon.usageLimit) {
            throw new Error("This coupon has been fully redeemed — no spots remaining.");
          }

          // Per-user check — no user can reuse the same coupon
          const userIdentifier = finalUserId || finalUserEmail;
          if (freshCoupon.usedByUsers && freshCoupon.usedByUsers.includes(userIdentifier)) {
            throw new Error("You have already used this coupon.");
          }

          // Add-on scope check
          const selectedAddons: string[] = formData.addons || [];
          if (scope === "addons") {
            const applicableAddons: string[] = freshCoupon.applicableAddons || ["all"];
            const matchingSelectedAddons = applicableAddons.includes("all")
              ? selectedAddons
              : selectedAddons.filter((a) => applicableAddons.includes(a));

            if (matchingSelectedAddons.length === 0) {
              throw new Error("This coupon is only valid when selecting applicable add-on boosters.");
            }
          }

          // Plan eligibility check
          if (scope === "plans") {
            const applicablePlans: string[] = freshCoupon.applicablePlans || ["all"];
            if (
              !applicablePlans.includes("all") &&
              !applicablePlans.includes(planName.toLowerCase().trim())
            ) {
              throw new Error(`This coupon is not valid for the ${planName} package.`);
            }
          }

          // Minimum order value check
          if (freshCoupon.minOrderValue && appliedTotalPrice < freshCoupon.minOrderValue) {
            throw new Error(
              `Minimum order of ₹${freshCoupon.minOrderValue.toLocaleString()} required for this coupon.`
            );
          }

          // 4. Calculate discount server-side based on scope
          let discountBaseAmount = appliedTotalPrice;
          if (scope === "addons") {
            const applicableAddons: string[] = freshCoupon.applicableAddons || ["all"];
            const matchingSelectedAddons = applicableAddons.includes("all")
              ? selectedAddons
              : selectedAddons.filter((a) => applicableAddons.includes(a));
            discountBaseAmount = matchingSelectedAddons.reduce(
              (sum, addonId) => sum + (ADDON_PRICES[addonId] || 0),
              0
            );
          }

          let discount = 0;
          if (freshCoupon.type === "percentage") {
            discount = Math.round(discountBaseAmount * (freshCoupon.value / 100));
            if (freshCoupon.maxDiscount && freshCoupon.maxDiscount > 0) {
              discount = Math.min(discount, freshCoupon.maxDiscount);
            }
          } else {
            // flat discount
            discount = Math.min(freshCoupon.value, discountBaseAmount);
          }

          // Ensure discount doesn't exceed total
          discount = Math.min(discount, appliedTotalPrice);

          // 5. ATOMIC UPDATE — increment usedCount + add user to usedByUsers
          transaction.update(couponRef, {
            usedCount: (freshCoupon.usedCount || 0) + 1,
            usedByUsers: [...(freshCoupon.usedByUsers || []), userIdentifier],
            updatedAt: new Date().toISOString(),
          });

          return {
            couponId: couponDoc.id,
            code: freshCoupon.code,
            type: freshCoupon.type as string,
            value: freshCoupon.value as number,
            discountAmount: discount,
            scope: scope,
          };
        });

        // Apply validated discount
        couponData = couponResult;
        appliedTotalPrice = appliedTotalPrice - couponResult.discountAmount;
      } catch (couponErr: any) {
        // Coupon validation failed — return clear error to client
        return NextResponse.json(
          { success: false, error: couponErr.message || "Coupon validation failed." },
          { status: 400 }
        );
      }
    }

    // Calculate 50/50 split on the discounted total
    const calculatedAdvance = Math.round(appliedTotalPrice * 0.5);
    const calculatedFinal = appliedTotalPrice - calculatedAdvance;

    const orderData: Record<string, any> = {
      userId: finalUserId || "GUEST_" + Date.now(),
      userEmail: finalUserEmail,
      planName: planName.trim(),
      originalTotalPrice: originalTotalPrice,
      totalPrice: appliedTotalPrice,
      advancePrice: calculatedAdvance,
      advancePaid: false,
      finalPrice: calculatedFinal,
      finalPaid: false,
      currency: "₹",
      status: "awaiting_advance",
      formData: {
        name: formData.name.trim(),
        email: finalUserEmail,
        company: formData.company?.trim() || "",
        projectType: formData.projectType || planName,
        timeline: formData.timeline || "Within 2 weeks",
        details: formData.details?.trim() || "",
        addons: formData.addons || [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Attach coupon info to the order if applied
    if (couponData) {
      orderData.couponCode = couponData.code;
      orderData.couponId = couponData.couponId;
      orderData.discountType = couponData.type;
      orderData.discountValue = couponData.value;
      orderData.discountAmount = couponData.discountAmount;
      orderData.discountScope = couponData.scope;
    }

    let orderId = "";
    if (adminDb) {
      const docRef = await adminDb.collection("orders").add(orderData);
      orderId = docRef.id;

      // Build notification message with coupon info if applicable
      const couponNotice = couponData
        ? ` | Coupon: ${couponData.code} (−₹${couponData.discountAmount.toLocaleString()})`
        : "";

      // Create notification for admin & developers only (No emojis)
      await adminDb.collection("notifications").add({
        title: `New Project Submitted: ${planName}`,
        message: `${formData.name} (${finalUserEmail}) submitted a new project with Total Fee: ₹${appliedTotalPrice.toLocaleString()} (50% Advance Due: ₹${calculatedAdvance.toLocaleString()})${couponNotice}.`,
        targetType: "admin_dev",
        targetRoles: ["admin", "super_admin", "developer"],
        senderName: "Project Booking Engine",
        senderRole: "System",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });
    }

    return NextResponse.json({
      success: true,
      orderId,
      totalPrice: appliedTotalPrice,
      originalTotalPrice: originalTotalPrice,
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
    console.error("Create order API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
