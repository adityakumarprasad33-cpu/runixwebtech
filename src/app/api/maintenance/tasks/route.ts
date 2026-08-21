import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CreateTaskSchema = z.object({
  orderId: z.string().min(5).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  category: z.string().max(50).default("bug_fix"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

const UpdateTaskSchema = z.object({
  orderId: z.string().min(5).max(100),
  taskId: z.string().min(5).max(100),
  status: z.enum(["investigating", "in_progress", "resolved"]),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_READ_OWN);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = CreateTaskSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid task data." }, { status: 400 });
    }

    const { orderId, title, description, category, priority } = parseResult.data;
    const orderRef = adminDb!.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const orderData = orderSnap.data() || {};
    // Verify participant
    if (
      orderData.userId !== authResult.uid &&
      orderData.assignedDeveloperId !== authResult.uid &&
      orderData.maintenanceAssignedDevId !== authResult.uid &&
      authResult.role !== "admin" &&
      authResult.role !== "super_admin"
    ) {
      return NextResponse.json({ success: false, error: "Forbidden: Not authorized on this order." }, { status: 403 });
    }

    const taskRef = await orderRef.collection("maintenance_tasks").add({
      title,
      description,
      category,
      priority,
      status: "investigating",
      createdAt: new Date().toISOString(),
      createdBy: authResult.uid,
      createdByName: authResult.name,
    });

    const targetDevId = orderData.maintenanceAssignedDevId || orderData.assignedDeveloperId;
    if (targetDevId) {
      await adminDb!.collection("notifications").add({
        title: `New Maintenance Task: ${title}`,
        message: `${authResult.name} submitted a new maintenance ticket for "${orderData.planName || "Website"}". Priority: ${priority.toUpperCase()}.`,
        actionLink: "/dashboard/workspace",
        actionText: "Open Maintenance Desk",
        targetType: "user",
        targetUserId: targetDevId,
        targetEmail: orderData.maintenanceAssignedDevEmail || null,
        senderName: authResult.name,
        senderRole: "Client",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });
    }

    await logSecurityEvent({
      action: "maintenance:create_task",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { taskId: taskRef.id, priority },
    });

    return NextResponse.json({ success: true, taskId: taskRef.id });
  } catch (error: any) {
    console.error("Create maintenance task error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to create task." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_READ_OWN);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = UpdateTaskSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid task update data." }, { status: 400 });
    }

    const { orderId, taskId, status } = parseResult.data;
    const orderRef = adminDb!.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const orderData = orderSnap.data() || {};
    const taskRef = orderRef.collection("maintenance_tasks").doc(taskId);

    const updatePayload: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (status === "resolved") {
      updatePayload.resolvedAt = new Date().toISOString();
      updatePayload.resolvedBy = authResult.uid;
    }

    await taskRef.update(updatePayload);

    if (status === "resolved" && orderData.userId) {
      await adminDb!.collection("notifications").add({
        title: "Maintenance Task Resolved",
        message: `Your maintenance ticket on "${orderData.planName || "Website"}" has been marked as resolved by your dedicated engineer.`,
        actionLink: "/dashboard/workspace",
        actionText: "View Resolution",
        targetType: "user",
        targetUserId: orderData.userId,
        targetEmail: orderData.userEmail || null,
        senderName: authResult.name,
        senderRole: authResult.role === "developer" ? "Maintenance Engineer" : "Admin",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });
    }

    await logSecurityEvent({
      action: "maintenance:update_task",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { taskId, status },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update maintenance task error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update task." }, { status: 500 });
  }
}
