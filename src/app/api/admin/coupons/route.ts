import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CouponSchema = z.object({
  code: z.string().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/),
  type: z.enum(["percentage", "flat"]),
  value: z.number().positive().max(100000),
  maxDiscount: z.number().nonnegative().optional().default(0),
  minOrderValue: z.number().nonnegative().optional().default(0),
  usageLimit: z.number().nonnegative().optional().default(0),
  scope: z.enum(["all", "plans", "addons", "maintenance"]).optional().default("all"),
  applicablePlans: z.array(z.string()).optional().default(["all"]),
  applicableAddons: z.array(z.string()).optional().default(["all"]),
  isActive: z.boolean().optional().default(true),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.COUPON_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = CouponSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid coupon parameters.", details: parseResult.error.flatten() }, { status: 400 });
    }

    const cleanCode = parseResult.data.code.toUpperCase().trim();

    // Check duplicate
    const existing = await adminDb!.collection("coupons").where("code", "==", cleanCode).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ success: false, error: "Promo code already exists." }, { status: 400 });
    }

    const docRef = await adminDb!.collection("coupons").add({
      ...parseResult.data,
      code: cleanCode,
      usedCount: 0,
      pendingReservations: 0,
      usedByUsers: [],
      createdBy: authResult.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await logSecurityEvent({
      action: "coupon:create",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: docRef.id,
      status: "success",
      ip: clientIp,
      metadata: { code: cleanCode },
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("Create coupon error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to create coupon." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.COUPON_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: "Coupon ID required." }, { status: 400 });

    const parseResult = CouponSchema.partial().safeParse(data);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid update data." }, { status: 400 });
    }

    await adminDb!.collection("coupons").doc(id).update({
      ...parseResult.data,
      updatedBy: authResult.email,
      updatedAt: new Date().toISOString(),
    });

    await logSecurityEvent({
      action: "coupon:update",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: id,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Coupon updated." });
  } catch (error: any) {
    console.error("Update coupon error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update coupon." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.COUPON_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Coupon ID required." }, { status: 400 });

    await adminDb!.collection("coupons").doc(id).delete();

    await logSecurityEvent({
      action: "coupon:delete",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: id,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Coupon deleted." });
  } catch (error: any) {
    console.error("Delete coupon error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete coupon." }, { status: 500 });
  }
}
