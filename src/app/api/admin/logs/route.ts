import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthAndPermission(req, Permission.AUDIT_LOG_READ);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "security"; // "security" | "admin" | "login"
    const limitParam = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));

    let collectionName = "security_logs";
    if (type === "admin") collectionName = "admin_activity_logs";
    if (type === "login") collectionName = "login_logs";

    const snap = await adminDb!
      .collection(collectionName)
      .orderBy("timestamp", "desc")
      .limit(limitParam)
      .get();

    const logs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("Fetch logs error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch audit logs." }, { status: 500 });
  }
}
