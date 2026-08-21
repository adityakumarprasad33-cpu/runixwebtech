import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VerifyAdvanceSchema = z.object({
  orderId: z.string().min(5).max(100),
  utrNumber: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_VERIFY_ADVANCE);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    const parseResult = VerifyAdvanceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid order parameters." }, { status: 400 });
    }

    const { orderId, utrNumber } = parseResult.data;
    const orderRef = adminDb!.collection("orders").doc(orderId);

    const result = await adminDb!.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }

      const orderData = orderSnap.data() || {};
      const nowIso = new Date().toISOString();

      const updatePayload: Record<string, any> = {
        advancePaid: true,
        advancePaidAt: nowIso,
        status: "in_progress",
        updatedAt: nowIso,
      };

      if (utrNumber) {
        updatePayload.utrNumber = utrNumber.trim().toUpperCase();
      }

      // Dynamic developer assignment if not yet assigned
      let assignedDev: any = null;
      if (!orderData.assignedDeveloperId) {
        const devsSnap = await adminDb!.collection("users").where("role", "==", "developer").get();
        const availableDevs = devsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d: any) => (d.activeProjectCount || 0) < (d.maxProjects || 5));

        availableDevs.sort((a: any, b: any) => (a.activeProjectCount || 0) - (b.activeProjectCount || 0));

        if (availableDevs.length > 0) {
          assignedDev = availableDevs[0];
          updatePayload.assignedDeveloperId = assignedDev.id;
          updatePayload.assignedDeveloperName = assignedDev.name || assignedDev.email || "Developer";
          updatePayload.assignedDeveloperEmail = assignedDev.email || "";
          updatePayload.assignedAt = nowIso;
          updatePayload.assignmentMode = "dynamic";

          const devRef = adminDb!.collection("users").doc(assignedDev.id);
          transaction.update(devRef, {
            activeProjectCount: (assignedDev.activeProjectCount || 0) + 1,
            updatedAt: nowIso,
          });
        }
      }

      // Finalize coupon redemption
      if (orderData.couponId) {
        const couponRef = adminDb!.collection("coupons").doc(orderData.couponId);
        const couponSnap = await transaction.get(couponRef);
        if (couponSnap.exists) {
          const cData = couponSnap.data() || {};
          const userIdentifier = orderData.userId || orderData.userEmail;
          const existingUsers = cData.usedByUsers || [];
          const newUsers = existingUsers.includes(userIdentifier) ? existingUsers : [...existingUsers, userIdentifier];

          transaction.update(couponRef, {
            usedCount: (cData.usedCount || 0) + 1,
            pendingReservations: Math.max(0, (cData.pendingReservations || 1) - 1),
            usedByUsers: newUsers,
            updatedAt: nowIso,
          });
        }
      }

      transaction.update(orderRef, updatePayload);
      return { orderData, assignedDev };
    });

    // Notify customer
    if (result.orderData.userId) {
      await adminDb!.collection("notifications").add({
        title: "⚡ 50% Advance Verified & Sprint Activated!",
        message: `Your advance payment for "${result.orderData.planName}" has been verified. Build sprint is now in progress.`,
        actionLink: "/dashboard/workspace",
        actionText: "Open Client Workspace",
        targetType: "user",
        targetUserId: result.orderData.userId,
        targetEmail: result.orderData.userEmail || null,
        senderName: "Operations Desk",
        senderRole: "Admin",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });
    }

    await logSecurityEvent({
      action: "order:verify_advance",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Advance payment verified successfully." });
  } catch (error: any) {
    console.error("Verify advance error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to verify advance payment." }, { status: 500 });
  }
}
