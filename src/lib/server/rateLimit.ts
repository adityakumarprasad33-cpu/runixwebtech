/**
 * Runix Distributed Rate Limiter
 * 
 * Implements Requirements 23, 33, 34:
 * - Stateless application instance compatible
 * - Protects login, signup, Google callback, password reset, verification, contact, and payments
 * - Pluggable Redis / Upstash with safe memory fallback
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export const RATE_LIMIT_PROFILES: Record<string, RateLimitConfig> = {
  login: { limit: 5, windowMs: 5 * 60 * 1000 }, // 5 attempts per 5 mins
  signup: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 attempts per 10 mins
  googleCallback: { limit: 10, windowMs: 5 * 60 * 1000 },
  resetPassword: { limit: 3, windowMs: 15 * 60 * 1000 },
  verifyEmail: { limit: 5, windowMs: 10 * 60 * 1000 },
  contact: { limit: 5, windowMs: 5 * 60 * 1000 },
  payments: { limit: 12, windowMs: 1 * 60 * 1000 },
};

// Stateless instances in production sync via distributed store / Redis.
// In-process sliding window store for local dev or fallback.
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check distributed rate limit for a client identifier and action profile
 */
export async function checkRateLimit(
  identifier: string,
  profile: keyof typeof RATE_LIMIT_PROFILES | RateLimitConfig
): Promise<RateLimitResult> {
  const config =
    typeof profile === "string" ? RATE_LIMIT_PROFILES[profile] : profile;

  if (!config) {
    return { success: true, limit: 100, remaining: 100, reset: Date.now() + 60000 };
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  // If Redis environment variables are present, perform distributed check
  const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisRestUrl && redisRestToken) {
    try {
      const response = await fetch(`${redisRestUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisRestToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["PTTL", key],
        ]),
      });

      if (response.ok) {
        const results = await response.json();
        const count = results[0]?.result || 1;
        let ttl = results[1]?.result || -1;

        if (ttl === -1) {
          // Set expiry
          await fetch(`${redisRestUrl}/PEXPIRE/${key}/${config.windowMs}`, {
            headers: { Authorization: `Bearer ${redisRestToken}` },
          });
          ttl = config.windowMs;
        }

        const remaining = Math.max(0, config.limit - count);
        return {
          success: count <= config.limit,
          limit: config.limit,
          remaining,
          reset: now + ttl,
        };
      }
    } catch {
      // Fallback to memory store if network or Redis temporarily unreachable
    }
  }

  // Memory fallback with sliding expiration
  const record = inMemoryStore.get(key);

  if (!record || now > record.resetTime) {
    inMemoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: now + config.windowMs,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, config.limit - record.count);

  return {
    success: record.count <= config.limit,
    limit: config.limit,
    remaining,
    reset: record.resetTime,
  };
}
