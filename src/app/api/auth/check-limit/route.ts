import { NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// In-memory rate limiting (works per-instance)
// Key: IP Address -> { count, startTime }
const rateLimitMap = new Map<string, { count: number; startTime: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: Request) {
  try {
    const { action, email, status, metadata } = await req.json();
    
    // Get IP Address
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("remote-addr") || "unknown-ip";

    // 1. Rate Limiting Check
    const now = Date.now();
    const limitData = rateLimitMap.get(ip);

    if (limitData) {
      if (now - limitData.startTime < WINDOW_MS) {
        if (limitData.count >= MAX_ATTEMPTS) {
          // Blocked
          await logToFirestore({ ip, action, email, status: "blocked", metadata: { ...metadata, reason: "Rate limit exceeded" } });
          return NextResponse.json({ error: "Too many attempts. Please try again in 15 minutes." }, { status: 429 });
        }
        // Increment count
        limitData.count += 1;
      } else {
        // Reset window
        rateLimitMap.set(ip, { count: 1, startTime: now });
      }
    } else {
      // First attempt
      rateLimitMap.set(ip, { count: 1, startTime: now });
    }

    // 2. Log to Firestore
    await logToFirestore({ ip, action, email, status, metadata });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in check-limit API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function logToFirestore(logData: any) {
  try {
    await addDoc(collection(db, "security_logs"), {
      ...logData,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to write to security_logs:", err);
  }
}
