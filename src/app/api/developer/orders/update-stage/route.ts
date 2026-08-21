import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UpdateStageSchema = z.object({
  orderId: z.string().min(5).max(100),
  stage: z.enum(["in_progress", "testing", "staging_deployed"]),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_READ_ASSIGNED);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = UpdateStageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid stage data." }, { status: 400 });
    }

    const { orderId, stage } = parseResult.data;
    const orderRef = adminDb!.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const orderData = orderSnap.data() || {};
    // Authorization: User must be assigned developer or admin
    if (orderData.assignedDeveloperId !== authResult.uid && authResult.role !== "admin" && authResult.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden: You are not assigned to this project." }, { status: 403 });
    }

    const stageLabels: Record<string, string> = {
      in_progress: "Active Development Sprint",
      testing: "Testing & Quality Assurance",
      staging_deployed: "Staging Deployed & Review",
    };

    await orderRef.update({
      devStage: stage,
      statusCaption: stageLabels[stage] || stage,
      updatedAt: new Date().toISOString(),
    });

    await logSecurityEvent({
      action: "developer:update_stage",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { stage },
    });

    return NextResponse.json({ success: true, stage, caption: stageLabels[stage] });
  } catch (error: any) {
    console.error("Update stage error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update development stage." }, { status: 500 });
  }
}
