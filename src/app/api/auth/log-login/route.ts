import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LogLoginSchema = z.object({
  email: z.string().email().max(150),
  action: z.string().max(50),
  userId: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  countryCode: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
  userAgent: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!adminDb) return NextResponse.json({ success: true });

    const ip = getTrustedClientIp(req);
    const body = await req.json();
    const parseResult = LogLoginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ success: true }); // non-blocking
    }

    const data = parseResult.data;
    await adminDb.collection("login_logs").add({
      ...data,
      ip,
      userAgent: data.userAgent || req.headers.get("user-agent") || "unknown",
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.warn("Log login error:", err);
    return NextResponse.json({ success: true });
  }
}
