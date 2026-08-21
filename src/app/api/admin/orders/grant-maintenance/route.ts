import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GrantMaintenanceSchema = z.object({
  orderId: z.string().min(5).max(100),
  days: z.number().min(1).max(365).optional().default(30),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_GRANT_MAINTENANCE);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    const parseResult = GrantMaintenanceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid maintenance parameters." }, { status: 400 });
    }

    const { orderId, days } = parseResult.data;
    const orderRef = adminDb!.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const orderData = orderSnap.data() || {};
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    await orderRef.update({
      maintenanceActive: true,
      maintenancePaid: true,
      maintenanceExpiresAt: expiryDate.toISOString(),
      maintenanceGrantedBy: authResult.email,
      maintenanceGrantedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Notify user
    if (orderData.userId) {
      await adminDb!.collection("notifications").add({
        title: "🛡️ 30-Day Free Maintenance SLA Activated!",
        message: `Your project "${orderData.planName}" is now protected under RUNIX Maintenance & Security Coverage until ${expiryDate.toLocaleDateString()}.`,
        actionLink: "/dashboard/workspace",
        actionText: "Open Maintenance Desk",
        targetType: "user",
        targetUserId: orderData.userId,
        targetEmail: orderData.userEmail || null,
        senderName: "Operations Desk",
        senderRole: "Admin",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });
    }

    await logSecurityEvent({
      action: "order:grant_maintenance",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { days, expiresAt: expiryDate.toISOString() },
    });

    return NextResponse.json({ success: true, message: `Maintenance active for ${days} days.` });
  } catch (error: any) {
    console.error("Grant maintenance error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to grant maintenance." }, { status: 500 });
  }
}
