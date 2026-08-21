import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SubmitUtrSchema = z.object({
  orderId: z.string().min(5).max(100),
  utrNumber: z.string().min(6).max(30).regex(/^[A-Za-z0-9_-]+$/, "UTR must contain alphanumeric characters only."),
  milestone: z.enum(["advance", "final", "maintenance"]).optional().default("advance"),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Service temporarily unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const parseResult = SubmitUtrSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid UTR reference number format.", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { orderId, utrNumber, milestone } = parseResult.data;
    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const orderData = orderSnap.data() || {};
    const cleanUtr = utrNumber.trim().toUpperCase();

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (milestone === "advance") {
      updatePayload.utrNumber = cleanUtr;
      updatePayload.paymentMethod = "upi_manual";
      updatePayload.status = "awaiting_verification";
    } else if (milestone === "final") {
      updatePayload.finalUtrNumber = cleanUtr;
      updatePayload.finalPaymentMethod = "upi_manual";
      updatePayload.status = "awaiting_verification";
    } else if (milestone === "maintenance") {
      updatePayload.maintenanceUtr = cleanUtr;
      updatePayload.maintenanceStatus = "awaiting_verification";
    }

    await orderRef.update(updatePayload);

    // Notify operations desk
    await adminDb.collection("notifications").add({
      title: `UTR Reference Submitted: ${orderData.planName || "Project"}`,
      message: `Client (${orderData.userEmail}) submitted UTR "${cleanUtr}" for ${milestone} milestone verification.`,
      targetType: "admin_dev",
      targetRoles: ["admin", "super_admin"],
      actionLink: "/dashboard/admin",
      actionText: "Verify in Admin Panel",
      senderName: "Billing Desk",
      senderRole: "System",
      createdAt: new Date().toISOString(),
      readBy: [],
      clearedBy: [],
    });

    await logSecurityEvent({
      action: "order:submit_utr",
      actorUid: orderData.userId || "guest",
      actorEmail: orderData.userEmail,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { milestone, cleanUtr },
    });

    return NextResponse.json({ success: true, message: "UTR submitted successfully." });
  } catch (error: any) {
    console.error("UTR submission error:", error);
    await logSecurityEvent({
      action: "order:submit_utr",
      status: "failed",
      ip: clientIp,
      reason: error?.message || "Internal error",
    });

    return NextResponse.json({ success: false, error: "Failed to submit UTR reference." }, { status: 500 });
  }
}
