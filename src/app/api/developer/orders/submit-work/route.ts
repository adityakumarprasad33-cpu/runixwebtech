import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SubmitWorkSchema = z.object({
  orderId: z.string().min(1).max(100),
  stagingUrl: z.string().min(3).max(500),
  devNotes: z.string().max(2000).optional(),
  handoverLinks: z
    .object({
      liveUrl: z.string().max(300).optional().nullable(),
      githubRepo: z.string().max(300).optional().nullable(),
      driveZip: z.string().max(300).optional().nullable(),
    })
    .optional(),
  handoverNotes: z.string().max(2000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_READ_ASSIGNED);
    if (authResult instanceof NextResponse) return authResult;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const parseResult = SubmitWorkSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid staging URL or order ID.", details: parseResult.error.flatten() }, { status: 400 });
    }

    const { orderId, stagingUrl, devNotes, handoverLinks, handoverNotes } = parseResult.data;

    let normalizedStagingUrl = stagingUrl.trim();
    if (!normalizedStagingUrl.startsWith("http://") && !normalizedStagingUrl.startsWith("https://")) {
      normalizedStagingUrl = `https://${normalizedStagingUrl}`;
    }

    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const orderData = orderSnap.data() || {};
    if (orderData.assignedDeveloperId !== authResult.uid && authResult.role !== "admin" && authResult.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden: You are not assigned to this project." }, { status: 403 });
    }

    const finalAmount = orderData.finalPrice || Math.round((orderData.totalPrice || 0) * 0.5);

    const updatePayload: Record<string, any> = {
      status: "awaiting_final_payment",
      stagingUrl: normalizedStagingUrl,
      demoUrl: normalizedStagingUrl,
      devNotes: devNotes?.trim() || null,
      devCompletedAt: new Date().toISOString(),
      statusCaption: "Work Completed — Staging Ready for Client Review 🚀",
      updatedAt: new Date().toISOString(),
    };

    if (handoverLinks) {
      updatePayload.handoverLinks = {
        githubRepo: handoverLinks.githubRepo?.trim() || orderData.handoverLinks?.githubRepo || null,
        liveUrl: handoverLinks.liveUrl?.trim() || orderData.handoverLinks?.liveUrl || null,
        driveZip: handoverLinks.driveZip?.trim() || orderData.handoverLinks?.driveZip || null,
      };
    }

    if (handoverNotes) {
      updatePayload.handoverNotes = handoverNotes.trim();
    }

    await orderRef.update(updatePayload);

    // Send real-time notification to customer
    if (orderData.userId) {
      try {
        await db.collection("notifications").add({
          title: "🚀 Project Completed by Developer — Staging Ready!",
          message: `${authResult.name} has completed the build sprint for "${orderData.planName}". Live staging demo is ready for review at: ${normalizedStagingUrl}. Settle final 50% milestone (₹${finalAmount.toLocaleString()}) to release full code repository and handover assets.`,
          actionLink: `/preview?url=${encodeURIComponent(normalizedStagingUrl)}&title=${encodeURIComponent(orderData.planName || "Staging Demo")}`,
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
      } catch (notifErr) {
        console.warn("Staging notification error:", notifErr);
      }
    }

    await logSecurityEvent({
      action: "developer:submit_work",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { stagingUrl: normalizedStagingUrl },
    });

    return NextResponse.json({ success: true, message: "Work submitted successfully.", stagingUrl: normalizedStagingUrl });
  } catch (error: any) {
    console.error("Submit work error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to submit work." }, { status: 500 });
  }
}
