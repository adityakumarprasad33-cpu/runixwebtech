import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OfferSchema = z.object({
  title: z.string().min(2).max(100),
  badge: z.string().max(50).optional().default(""),
  discount: z.string().max(50).optional().default(""),
  description: z.string().max(1000).optional().default(""),
  couponCode: z.string().max(50).optional().default(""),
  validUntil: z.string().max(50).optional().default(""),
  features: z.array(z.string()).optional().default([]),
  ctaText: z.string().max(50).optional().default("Claim Offer"),
  ctaLink: z.string().max(200).optional().default("/pricing"),
  gradient: z.string().max(100).optional().default("from-indigo-600 to-violet-600"),
  isActive: z.boolean().optional().default(true),
  targetCategory: z.string().max(50).optional().default("all"),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.OFFER_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = OfferSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid offer parameters.", details: parseResult.error.flatten() }, { status: 400 });
    }

    const docRef = await adminDb!.collection("offers").add({
      ...parseResult.data,
      createdBy: authResult.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await logSecurityEvent({
      action: "offer:create",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: docRef.id,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("Create offer error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to create offer." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.OFFER_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: "Offer ID required." }, { status: 400 });

    const parseResult = OfferSchema.partial().safeParse(data);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid update data." }, { status: 400 });
    }

    await adminDb!.collection("offers").doc(id).update({
      ...parseResult.data,
      updatedBy: authResult.email,
      updatedAt: new Date().toISOString(),
    });

    await logSecurityEvent({
      action: "offer:update",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: id,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Offer updated." });
  } catch (error: any) {
    console.error("Update offer error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update offer." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.OFFER_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Offer ID required." }, { status: 400 });

    await adminDb!.collection("offers").doc(id).delete();

    await logSecurityEvent({
      action: "offer:delete",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: id,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Offer deleted." });
  } catch (error: any) {
    console.error("Delete offer error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete offer." }, { status: 500 });
  }
}
