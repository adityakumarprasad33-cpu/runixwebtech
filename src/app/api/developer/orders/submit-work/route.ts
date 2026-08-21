import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SubmitWorkSchema = z.object({
  orderId: z.string().min(5).max(100),
  stagingUrl: z.string().url().max(500),
  devNotes: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_READ_ASSIGNED);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = SubmitWorkSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid staging URL.", details: parseResult.error.flatten() }, { status: 400 });
    }

    const { orderId, stagingUrl, devNotes } = parseResult.data;
    const orderRef = adminDb!.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const orderData = orderSnap.data() || {};
    if (orderData.assignedDeveloperId !== authResult.uid && authResult.role !== "admin" && authResult.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden: You are not assigned to this project." }, { status: 403 });
    }

    const finalAmount = orderData.finalPrice || Math.round((orderData.totalPrice || 0) * 0.5);

    await orderRef.update({
      status: "awaiting_final_payment",
      stagingUrl,
      devNotes: devNotes?.trim() || null,
      devCompletedAt: new Date().toISOString(),
      statusCaption: "Work Completed — Staging Ready for Client Review 🚀",
      updatedAt: new Date().toISOString(),
    });

    // Send real-time notification to customer
    if (orderData.userId) {
      await adminDb!.collection("notifications").add({
        title: "🚀 Project Completed by Developer — Staging Ready!",
        message: `${authResult.name} has completed the build sprint for "${orderData.planName}". Live staging demo is ready for review at: ${stagingUrl}. Settle final 50% milestone (₹${finalAmount.toLocaleString()}) to release full code repository and handover assets.`,
        actionLink: stagingUrl,
        actionText: "Preview Staging",
        targetType: "user",
        targetUserId: orderData.userId,
        targetEmail: orderData.userEmail || null,
        senderName: authResult.name,
        senderRole: "Developer",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });
    }

    await logSecurityEvent({
      action: "developer:submit_work",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { stagingUrl },
    });

    return NextResponse.json({ success: true, message: "Work submitted successfully." });
  } catch (error: any) {
    console.error("Submit work error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to submit work." }, { status: 500 });
  }
}
