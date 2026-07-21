import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Edge-level IP rate limiter ─────────────────────────────────────────────
// Runs BEFORE the request hits any route handler.
// Uses an in-process Map (edge runtime — resets per cold-start, but provides
// a fast first line of defence against bot floods on /api/* routes).
//
// For persistent cross-instance blocking, the server-side Firestore-backed
// limiter in /api/auth/check-limit handles longer-term lockouts.

const EDGE_LIMIT = 60;         // max requests per window per IP
const EDGE_WINDOW_MS = 60_000; // 1-minute rolling window

const edgeMap = new Map<string, { count: number; start: number }>();

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit /api/* routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const entry = edgeMap.get(ip);

  if (entry) {
    if (now - entry.start < EDGE_WINDOW_MS) {
      if (entry.count >= EDGE_LIMIT) {
        return new NextResponse(
          JSON.stringify({
            error: "Rate limit exceeded. Too many requests from your IP.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "60",
              "X-RateLimit-Limit": String(EDGE_LIMIT),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }
      entry.count++;
    } else {
      // Reset window
      edgeMap.set(ip, { count: 1, start: now });
    }
  } else {
    edgeMap.set(ip, { count: 1, start: now });
  }

  const remaining = EDGE_LIMIT - (edgeMap.get(ip)?.count ?? 0);
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(EDGE_LIMIT));
  response.headers.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
