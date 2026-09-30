import { NextResponse } from "next/server";
import { getQueueMetrics } from "@/lib/server/taskQueue";

/**
 * Health & Readiness Probe (Requirement 43)
 * Provides liveness and readiness status for load balancers without leaking sensitive secrets.
 */
export async function GET() {
  const queueMetrics = getQueueMetrics();

  let adminDbStatus = "untested";
  let adminImportError: string | null = null;
  try {
    const { getAdminDb } = await import("@/lib/server/firebase-admin");
    const db = getAdminDb();
    adminDbStatus = db ? "connected" : "null_db";
  } catch (err: any) {
    adminImportError = err?.message || String(err);
  }

  const healthData = {
    status: "ok",
    version: "2.4.1",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
    },
    envFlags: {
      hasProjectId: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      hasClientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      hasPrivateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      hasServiceAccountKey: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_CONFIG_ADMIN),
    },
    database: {
      adminDbStatus,
      adminImportError,
    },
    checks: {
      instances: "stateless",
      application: "healthy",
      taskQueue: {
        activeWorkers: queueMetrics.activeWorkers,
        queued: queueMetrics.queuedCount,
      },
    },
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
