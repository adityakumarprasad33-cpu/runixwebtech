import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PaymentSettingsSchema = z.object({
  paymentMode: z.enum(["manual", "paytm"]),
  upiId: z.string().min(3).max(100),
  upiName: z.string().min(1).max(100),
  upiNumber: z.string().max(20).optional().default(""),
  qrCodeUrl: z.string().max(1000).optional().default(""),
  paymentInstructions: z.string().max(1000).optional().default(""),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.PAYMENT_SETTINGS_UPDATE);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    const parseResult = PaymentSettingsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid payment settings format.", details: parseResult.error.flatten() }, { status: 400 });
    }

    await adminDb!.collection("settings").doc("payment").set(
      {
        ...parseResult.data,
        updatedBy: authResult.email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await logSecurityEvent({
      action: "settings:update_payment",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      status: "success",
      ip: clientIp,
      metadata: { mode: parseResult.data.paymentMode, upiId: parseResult.data.upiId },
    });

    return NextResponse.json({ success: true, message: "Payment settings updated successfully." });
  } catch (error: any) {
    console.error("Payment settings error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update payment settings." }, { status: 500 });
  }
}
