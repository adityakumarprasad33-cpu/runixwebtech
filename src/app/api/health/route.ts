import { NextResponse } from "next/server";
import { getQueueMetrics } from "@/lib/server/taskQueue";

/**
 * Health & Readiness Probe (Requirement 43)
 * Provides liveness and readiness status for load balancers without leaking sensitive secrets.
 */
export async function GET() {
  const queueMetrics = getQueueMetrics();

  const healthData = {
    status: "ok",
    version: "2.4.0",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
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
