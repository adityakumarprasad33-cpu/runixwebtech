import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Progressive lockout thresholds
const RULES = [
  { attempts: 10, lockoutMs: 24 * 60 * 60 * 1000 }, // 10 fails → 24 hr
  { attempts: 5,  lockoutMs: 30 * 60 * 1000 },        // 5 fails  → 30 min
  { attempts: 3,  lockoutMs: 5 * 60 * 1000 },          // 3 fails  → 5 min
];
const WINDOW_MS = 15 * 60 * 1000; // Reset counter every 15 min

export async function POST(req: NextRequest) {
  const ip = getTrustedClientIp(req);

  try {
    if (!adminDb) {
      // Fail closed: Security limiter must not silently bypass during backend failure
      return NextResponse.json(
        { error: "Security service temporarily unavailable. Please retry in 30 seconds." },
        { status: 503 }
      );
    }

    const { action, email, status, metadata } = await req.json();
    const cleanAction = (action || "auth_login").replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanIp = ip.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${cleanIp}_${cleanAction}`;

    const storeRef = adminDb.collection("rate_limit_store").doc(key);
    const now = Date.now();

    // Atomic transaction for rate limit check and state update
    const result = await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(storeRef);
      const data = snap.exists
        ? (snap.data() as { count: number; windowStart: number; lockedUntil: number })
        : { count: 0, windowStart: now, lockedUntil: 0 };

      // 1. Check if currently locked out
      if (data.lockedUntil > now) {
        const remainingMin = Math.ceil((data.lockedUntil - now) / 60000);
        return {
          isLocked: true,
          remainingMin,
          lockedUntil: data.lockedUntil,
          count: data.count,
        };
      }

      // 2. Window expiration reset
      let count = data.count || 0;
      let windowStart = data.windowStart || now;
      if (now - windowStart > WINDOW_MS) {
        count = 0;
        windowStart = now;
      }

      // 3. Increment counter
      count += 1;

      // 4. Evaluate lockout thresholds
      let lockedUntil = 0;
      for (const rule of RULES) {
        if (count >= rule.attempts) {
          lockedUntil = now + rule.lockoutMs;
          break;
        }
      }

      // 5. Atomic state update
      transaction.set(
        storeRef,
        {
          count,
          windowStart,
          lockedUntil,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return {
        isLocked: lockedUntil > now,
        remainingMin: Math.ceil((lockedUntil - now) / 60000),
        lockedUntil,
        count,
      };
    });

    if (result.isLocked) {
      await logSecurityEvent({
        action: "auth:rate_limit_locked",
        actorEmail: email,
        status: "denied",
        ip,
        reason: `Rate limit triggered: ${result.count} attempts. Locked for ${result.remainingMin} min.`,
        metadata,
      });

      return NextResponse.json(
        {
          error: `Too many failed attempts. Access temporarily locked for ${result.remainingMin} minute(s).`,
          retryAfter: result.lockedUntil,
        },
        { status: 429 }
      );
    }

    await logSecurityEvent({
      action: `auth:${action || "attempt"}`,
      actorEmail: email,
      status: status === "success" ? "success" : "denied",
      ip,
      metadata,
    });

    return NextResponse.json({
      success: true,
      attemptsRemaining: Math.max(0, 3 - result.count),
    });
  } catch (error: any) {
    console.error("Rate limiter server error:", error);
    await logSecurityEvent({
      action: "auth:rate_limiter_error",
      status: "failed",
      ip,
      reason: error?.message || "Internal error",
    });

    // Fail safely
    return NextResponse.json(
      { error: "Security validation error. Please try again." },
      { status: 500 }
    );
  }
}
