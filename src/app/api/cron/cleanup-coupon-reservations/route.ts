import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { logSecurityEvent } from "@/lib/server/securityLogger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Netlify Scheduled Cron Function / API Endpoint.
 * Reconciles abandoned coupon reservations (> 24h old in awaiting_advance state).
 * Protected by CRON_SECRET authorization header.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized cron execution." }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database unavailable." }, { status: 503 });
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Query unpaid orders with active coupon reservations older than 24 hours
    const expiredOrdersSnap = await adminDb
      .collection("orders")
      .where("status", "==", "awaiting_advance")
      .where("couponReservedAt", "<=", cutoff)
      .limit(50)
      .get();

    let reconciledCount = 0;

    for (const orderDoc of expiredOrdersSnap.docs) {
      const orderData = orderDoc.data();
      const couponId = orderData.couponId;

      if (couponId) {
        await adminDb.runTransaction(async (transaction) => {
          const couponRef = adminDb!.collection("coupons").doc(couponId);
          const couponSnap = await transaction.get(couponRef);

          if (couponSnap.exists) {
            const cData = couponSnap.data() || {};
            const currentPending = cData.pendingReservations || 0;
            if (currentPending > 0) {
              transaction.update(couponRef, {
                pendingReservations: Math.max(0, currentPending - 1),
                updatedAt: new Date().toISOString(),
              });
            }
          }

          // Mark reservation as expired on the order to prevent duplicate reconciliations
          transaction.update(orderDoc.ref, {
            couponReservationStatus: "expired",
            updatedAt: new Date().toISOString(),
          });
        });

        reconciledCount++;
      }
    }

    await logSecurityEvent({
      action: "cron:cleanup_coupon_reservations",
      status: "success",
      metadata: { reconciledCount },
    });

    return NextResponse.json({ success: true, reconciledCount });
  } catch (error: any) {
    console.error("Cron reconciliation error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Reconciliation failed" }, { status: 500 });
  }
}
