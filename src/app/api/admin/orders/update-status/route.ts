import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UpdateStatusSchema = z.object({
  orderId: z.string().min(5).max(100),
  status: z.enum(["awaiting_advance", "awaiting_verification", "in_progress", "awaiting_final_payment", "completed", "cancelled", "rejected"]),
  statusCaption: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_UPDATE_STATUS);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    const parseResult = UpdateStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid status parameter.", details: parseResult.error.flatten() }, { status: 400 });
    }

    const { orderId, status, statusCaption } = parseResult.data;
    const orderRef = adminDb!.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (statusCaption !== undefined) {
      updatePayload.statusCaption = statusCaption.trim();
    }

    await orderRef.update(updatePayload);

    await logSecurityEvent({
      action: "order:update_status",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { newStatus: status, statusCaption },
    });

    return NextResponse.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (error: any) {
    console.error("Update status error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update order status." }, { status: 500 });
  }
}
