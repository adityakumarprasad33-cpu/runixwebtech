import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CreateNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  targetType: z.enum(["broadcast", "user", "admin_dev"]).default("broadcast"),
  targetUserId: z.string().max(100).optional().nullable(),
  targetEmail: z.string().max(150).optional().nullable(),
  actionLink: z.string().max(500).optional().nullable(),
  actionText: z.string().max(100).optional().nullable(),
  type: z.string().max(50).optional().default("info"),
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
    const authResult = await requireAuthAndPermission(req, Permission.AUDIT_LOG_READ);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = CreateNotificationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid notification parameters.", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const docRef = await db.collection("notifications").add({
      ...data,
      senderName: authResult.name,
      senderRole: authResult.role === "super_admin" ? "Super Admin" : "Admin",
      senderEmail: authResult.email,
      createdAt: new Date().toISOString(),
      readBy: [],
      clearedBy: [],
    });

    await logSecurityEvent({
      action: "notification:create",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: docRef.id,
      status: "success",
      ip: clientIp,
      metadata: { targetType: data.targetType, title: data.title },
    });

    return NextResponse.json({ success: true, id: docRef.id, message: "Notification published." });
  } catch (error: any) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create notification." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);
  const db = getAdminDb();

  if (!db) {
    return NextResponse.json(
      { success: false, error: "Database service unavailable." },
      { status: 503 }
    );
  }

  try {
    const authResult = await requireAuthAndPermission(req, Permission.AUDIT_LOG_READ);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Notification ID required." }, { status: 400 });

    await db.collection("notifications").doc(id).delete();

    await logSecurityEvent({
      action: "notification:delete",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: id,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Notification deleted." });
  } catch (error: any) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete notification." },
      { status: 500 }
    );
  }
}
