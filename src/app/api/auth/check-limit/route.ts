import { NextResponse } from "next/server";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Progressive lockout thresholds ─────────────────────────────────────────
const RULES = [
  { attempts: 10, lockoutMs: 24 * 60 * 60 * 1000 }, // 10 fails → 24 hr
  { attempts: 5,  lockoutMs: 30 * 60 * 1000 },        // 5 fails  → 30 min
  { attempts: 3,  lockoutMs: 5 * 60 * 1000 },          // 3 fails  → 5 min
];
const WINDOW_MS = 15 * 60 * 1000; // Reset attempt counter every 15 min

// ── Firestore-backed rate limiter ──────────────────────────────────────────
// Stored in:  rate_limit_store/{ip}_{action}
//   { count, windowStart, lockedUntil }
export async function POST(req: Request) {
  try {
    const { action, email, status, metadata } = await req.json();

    // Get IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("remote-addr") ||
      "unknown-ip";

    const key = `${ip}_${action || "default"}`;
    const storeRef = doc(db, "rate_limit_store", key);

    const now = Date.now();

    // 1. Read current state from Firestore
    const snap = await getDoc(storeRef);
    const data = snap.exists()
      ? (snap.data() as { count: number; windowStart: number; lockedUntil: number })
      : { count: 0, windowStart: now, lockedUntil: 0 };

    // 2. Check if currently locked out
    if (data.lockedUntil > now) {
      const remainingMin = Math.ceil((data.lockedUntil - now) / 60000);
      await logToFirestore({
        ip,
        action,
        email,
        status: "blocked",
        metadata: {
          ...metadata,
          reason: `Locked out — try again in ${remainingMin} minute(s)`,
          lockedUntil: new Date(data.lockedUntil).toISOString(),
        },
      });
      return NextResponse.json(
        {
          error: `Too many failed attempts. Please try again in ${remainingMin} minute(s).`,
          retryAfter: data.lockedUntil,
        },
        { status: 429 }
      );
    }

    // 3. Reset counter if window expired
    let count = data.count;
    let windowStart = data.windowStart;
    if (now - windowStart > WINDOW_MS) {
      count = 0;
      windowStart = now;
    }

    // 4. Increment attempt counter
    count += 1;

    // 5. Determine lockout based on thresholds
    let lockedUntil = 0;
    for (const rule of RULES) {
      if (count >= rule.attempts) {
        lockedUntil = now + rule.lockoutMs;
        break;
      }
    }

    // 6. Persist updated state to Firestore
    await setDoc(storeRef, { count, windowStart, lockedUntil }, { merge: true });

    // 7. If this attempt triggered a lockout, block immediately
    if (lockedUntil > now) {
      const remainingMin = Math.ceil((lockedUntil - now) / 60000);
      await logToFirestore({
        ip,
        action,
        email,
        status: "blocked",
        metadata: {
          ...metadata,
          reason: `Lockout triggered after ${count} attempts`,
          lockedUntil: new Date(lockedUntil).toISOString(),
        },
      });
      return NextResponse.json(
        {
          error: `Too many failed attempts. Locked out for ${remainingMin} minute(s).`,
          retryAfter: lockedUntil,
        },
        { status: 429 }
      );
    }

    // 8. Allow — log the event
    await logToFirestore({ ip, action, email, status, metadata });
    return NextResponse.json({ success: true, attemptsRemaining: Math.max(0, 3 - count) });
  } catch (error) {
    console.error("Error in check-limit API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function logToFirestore(logData: Record<string, unknown>) {
  try {
    await addDoc(collection(db, "security_logs"), {
      ...logData,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to write to security_logs:", err);
  }
}
