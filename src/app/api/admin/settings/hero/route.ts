import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    const authResult = await requireAuthAndPermission(req, Permission.PAYMENT_SETTINGS_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();

    await db.collection("settings").doc("hero_stats").set(
      {
        ...body,
        updatedBy: authResult.email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await logSecurityEvent({
      action: "settings:update_hero_stats",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Hero statistics updated successfully." });
  } catch (error: any) {
    console.error("Save hero stats error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update hero stats." },
      { status: 500 }
    );
  }
}
