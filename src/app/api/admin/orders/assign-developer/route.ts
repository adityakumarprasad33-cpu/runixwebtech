import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AssignDeveloperSchema = z.object({
  orderId: z.string().min(5).max(100),
  developerId: z.string().min(5).max(100),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_ASSIGN_DEV);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const parseResult = AssignDeveloperSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid developer assignment parameters." }, { status: 400 });
    }

    const { orderId, developerId } = parseResult.data;
    const orderRef = db.collection("orders").doc(orderId);
    const newDevRef = db.collection("users").doc(developerId);

    const result = await db.runTransaction(async (transaction) => {
      // ═══════════════════════════════════════════════════════════════
      // 1. ALL READS FIRST (Strict Firestore Transaction Protocol)
      // ═══════════════════════════════════════════════════════════════
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }

      const orderData = orderSnap.data() || {};
      const oldDevId = orderData.assignedDeveloperId;

      const newDevSnap = await transaction.get(newDevRef);
      if (!newDevSnap.exists) {
        throw new Error("Target developer user not found.");
      }

      const newDevData = newDevSnap.data() || {};
      if (newDevData.role !== "developer" && newDevData.role !== "admin" && newDevData.role !== "super_admin") {
        throw new Error("Selected user does not have developer privileges.");
      }

      let oldDevSnap: any = null;
      let oldDevRef: any = null;
      if (oldDevId && oldDevId !== developerId) {
        oldDevRef = db.collection("users").doc(oldDevId);
        oldDevSnap = await transaction.get(oldDevRef);
      }

      // ═══════════════════════════════════════════════════════════════
      // 2. ALL WRITES AFTER (Strict Firestore Transaction Protocol)
      // ═══════════════════════════════════════════════════════════════
      const nowIso = new Date().toISOString();

      // Update order
      transaction.update(orderRef, {
        assignedDeveloperId: developerId,
        assignedDeveloperName: newDevData.name || newDevData.email || "Developer",
        assignedDeveloperEmail: newDevData.email || "",
        assignedAt: nowIso,
        assignmentMode: "manual",
        updatedAt: nowIso,
      });

      // Increment new dev load
      transaction.update(newDevRef, {
        activeProjectCount: (newDevData.activeProjectCount || 0) + 1,
        updatedAt: nowIso,
      });

      // Decrement old dev load if reassigning
      if (oldDevRef && oldDevSnap?.exists) {
        const oldDevData = oldDevSnap.data() || {};
        transaction.update(oldDevRef, {
          activeProjectCount: Math.max(0, (oldDevData.activeProjectCount || 1) - 1),
          updatedAt: nowIso,
        });
      }

      return { orderData, newDevData };
    });

    // Notify developer
    await db.collection("notifications").add({
      title: "🛠️ New Project Assigned by Operations Desk",
      message: `You have been manually assigned to build "${result.orderData.planName}". Open your developer workspace to review specifications.`,
      actionLink: "/dashboard/workspace",
      actionText: "Open Workspace",
      targetType: "user",
      targetUserId: developerId,
      targetEmail: result.newDevData.email || null,
      senderName: authResult.name || "Operations Desk",
      senderRole: "Admin",
      createdAt: new Date().toISOString(),
      readBy: [],
      clearedBy: [],
    });

    await logSecurityEvent({
      action: "order:assign_developer",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { developerId, devEmail: result.newDevData.email },
    });

    return NextResponse.json({ success: true, message: "Developer assigned successfully." });
  } catch (error: any) {
    console.error("Assign developer error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to assign developer." }, { status: 500 });
  }
}
