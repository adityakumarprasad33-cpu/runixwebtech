import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const QuerySchema = z.object({
  orderId: z.string().min(5).max(100),
  queryText: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);
  const db = getAdminDb();

  if (!db) {
    return NextResponse.json(
      { success: false, error: "Database service unavailable." },
      { status: 503 }
    );
  }

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_UPDATE_STATUS);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = QuerySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters.", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { orderId, queryText } = parseResult.data;
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const orderData = orderSnap.data() || {};
    const nowIso = new Date().toISOString();

    await orderRef.update({
      adminQuery: queryText.trim(),
      hasPendingQuery: true,
      queryCreatedAt: nowIso,
      updatedAt: nowIso,
    });

    // Notify customer
    if (orderData.userId) {
      await db.collection("notifications").add({
        title: "Action Required: Project Query",
        message: `Admin has asked a question regarding your order "${orderData.planName || "Project"}". Please respond on your dashboard.`,
        targetType: "user",
        targetUserId: orderData.userId,
        targetEmail: orderData.userEmail || null,
        actionLink: "/dashboard/workspace",
        actionText: "Reply to Query",
        senderName: authResult.name || "Operations Desk",
        senderRole: "Admin",
        senderEmail: authResult.email,
        createdAt: nowIso,
        readBy: [],
        clearedBy: [],
      });
    }

    await logSecurityEvent({
      action: "order:send_query",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { queryText },
    });

    return NextResponse.json({ success: true, message: "Query sent successfully." });
  } catch (error: any) {
    console.error("Send query error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send query." },
      { status: 500 }
    );
  }
}
