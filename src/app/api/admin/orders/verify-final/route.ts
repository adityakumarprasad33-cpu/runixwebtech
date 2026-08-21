import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VerifyFinalSchema = z.object({
  orderId: z.string().min(5).max(100),
  finalUtrNumber: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_VERIFY_FINAL);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    const parseResult = VerifyFinalSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid order parameters." }, { status: 400 });
    }

    const { orderId, finalUtrNumber } = parseResult.data;
    const orderRef = adminDb!.collection("orders").doc(orderId);

    const result = await adminDb!.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }

      const orderData = orderSnap.data() || {};
      const nowIso = new Date().toISOString();

      const updatePayload: Record<string, any> = {
        finalPaid: true,
        finalPaidAt: nowIso,
        status: "completed",
        updatedAt: nowIso,
      };

      if (finalUtrNumber) {
        updatePayload.finalUtrNumber = finalUtrNumber.trim().toUpperCase();
      }

      // Decrement developer active project load
      if (orderData.assignedDeveloperId) {
        const devRef = adminDb!.collection("users").doc(orderData.assignedDeveloperId);
        const devSnap = await transaction.get(devRef);
        if (devSnap.exists) {
          const currentDev = devSnap.data() || {};
          transaction.update(devRef, {
            activeProjectCount: Math.max(0, (currentDev.activeProjectCount || 1) - 1),
            updatedAt: nowIso,
          });
        }
      }

      transaction.update(orderRef, updatePayload);
      return orderData;
    });

    // Notify customer of completion
    if (result.userId) {
      await adminDb!.collection("notifications").add({
        title: "🎉 Final Milestone Verified & Handover Complete!",
        message: `Your final payment for "${result.planName}" has been verified. GitHub codebase and deployment keys are now released in your workspace.`,
        actionLink: "/dashboard/workspace",
        actionText: "Access Handover Assets",
        targetType: "user",
        targetUserId: result.userId,
        targetEmail: result.userEmail || null,
        senderName: "Operations Desk",
        senderRole: "Admin",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });
    }

    await logSecurityEvent({
      action: "order:verify_final",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Final payment verified and project marked completed." });
  } catch (error: any) {
    console.error("Verify final error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to verify final payment." }, { status: 500 });
  }
}
