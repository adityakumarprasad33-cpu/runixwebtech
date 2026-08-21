import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RecordLogSchema = z.object({
  action: z.string().min(1).max(100),
  details: z.record(z.string(), z.any()).optional().default({}),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthAndPermission(req, Permission.AUDIT_LOG_READ);
    if (authResult instanceof NextResponse) return authResult;

    const ip = getTrustedClientIp(req);
    const body = await req.json();
    const parseResult = RecordLogSchema.safeParse(body);
    if (!parseResult.success) return NextResponse.json({ success: true });

    const { action, details } = parseResult.data;
    await adminDb!.collection("admin_activity_logs").add({
      adminId: authResult.uid,
      adminName: authResult.name,
      adminEmail: authResult.email,
      action,
      details,
      ip,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: true });
  }
}
