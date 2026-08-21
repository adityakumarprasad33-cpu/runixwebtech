import { adminDb } from "@/lib/server/firebase-admin";
import crypto from "crypto";

export interface SecurityLogEntry {
  correlationId?: string;
  actorUid?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resourceId?: string;
  status: "success" | "denied" | "failed";
  ip?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Sanitizes and writes audit and security events to the server-only security_logs collection.
 * Automatically masks tokens, passwords, and sensitive keys.
 */
export async function logSecurityEvent(entry: SecurityLogEntry): Promise<void> {
  if (!adminDb) return;

  try {
    const correlationId = entry.correlationId || `sec_${crypto.randomUUID()}`;
    const sanitizedMetadata: Record<string, any> = {};

    if (entry.metadata) {
      for (const [k, v] of Object.entries(entry.metadata)) {
        const lowerKey = k.toLowerCase();
        if (
          lowerKey.includes("password") ||
          lowerKey.includes("token") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("key") ||
          lowerKey.includes("cookie") ||
          lowerKey.includes("auth")
        ) {
          sanitizedMetadata[k] = "[REDACTED]";
        } else if (v !== undefined) {
          sanitizedMetadata[k] = v;
        }
      }
    }

    await adminDb.collection("security_logs").add({
      correlationId,
      actorUid: entry.actorUid || "anonymous",
      actorEmail: entry.actorEmail || null,
      actorRole: entry.actorRole || "guest",
      action: entry.action,
      resourceId: entry.resourceId || null,
      status: entry.status,
      ip: entry.ip || "unknown",
      reason: entry.reason || null,
      metadata: sanitizedMetadata,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to write server security log:", err);
  }
}
