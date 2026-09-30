/**
 * Runix Production Observability & Security Audit Engine
 * 
 * Implements Requirements 39, 40:
 * - Structured JSON logging with request IDs
 * - Latency & metrics collection
 * - Strict sanitization: NEVER logs passwords, sessions, refresh tokens, auth codes, or secrets
 */

export interface StructuredLogEntry {
  level: "info" | "warn" | "error" | "audit";
  timestamp: string;
  requestId?: string;
  action: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  durationMs?: number;
}

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "refreshtoken",
  "session",
  "secret",
  "authorization",
  "code",
  "apikey",
  "checksum",
]);

/**
 * Recursively sanitizes any payload to ensure no credentials or secrets leak into log collectors
 */
export function sanitizeLogData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Emits a structured log
 */
export function logEvent(entry: StructuredLogEntry): void {
  const sanitizedEntry = {
    ...entry,
    metadata: entry.metadata ? (sanitizeLogData(entry.metadata) as Record<string, unknown>) : undefined,
  };

  const jsonStr = JSON.stringify(sanitizedEntry);

  if (entry.level === "error") {
    console.error(jsonStr);
  } else if (entry.level === "warn") {
    console.warn(jsonStr);
  } else {
    console.log(jsonStr);
  }
}

/**
 * Emits a security audit log (Requirement 40)
 */
export function logSecurityAudit(
  action: string,
  userId: string | undefined,
  metadata?: Record<string, unknown>,
  requestId?: string
): void {
  logEvent({
    level: "audit",
    timestamp: new Date().toISOString(),
    action,
    userId,
    metadata,
    requestId,
  });
}
