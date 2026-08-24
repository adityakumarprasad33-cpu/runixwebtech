import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DisbursePayoutSchema = z.object({
  orderId: z.string().min(3).max(100),
  developerId: z.string().min(3).max(100),
  amount: z.number().positive(),
  paymentMethod: z.enum(["upi", "bank_transfer", "card", "other"]).default("upi"),
  utrNumber: z.string().min(4).max(100),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.EXPENSE_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const parseResult = DisbursePayoutSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid disbursement parameters.", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { orderId, developerId, amount, paymentMethod, utrNumber, notes } = parseResult.data;
    const nowIso = new Date().toISOString();

    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const orderData = orderSnap.data() || {};
    const devDoc = await db.collection("users").doc(developerId).get();
    const devData = devDoc.data() || {};
    const devName = devData.name || devData.displayName || orderData.assignedDeveloperName || "Assigned Developer";

    const voucherNumber = `VCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const developerPayout = {
      status: "paid",
      amount,
      percentage: 40,
      paidAt: nowIso,
      utr: utrNumber,
      paymentMethod,
      paidBy: authResult.email,
      voucherNumber,
      notes: notes || null,
    };

    // 1. Update Order
    await orderRef.update({
      developerPayout,
      updatedAt: nowIso,
    });

    // 2. Write Outflow Entry to General Ledger / expenses collection
    const expenseEntry = {
      title: `40% Sprint Payout: ${orderData.planName || "Client Build"} (Order #${orderId.slice(-6).toUpperCase()})`,
      amount,
      category: "developer_payout",
      payee: devName,
      payeeEmail: devData.email || null,
      paymentMethod,
      referenceNumber: utrNumber,
      orderId,
      projectPlan: orderData.planName || "Sprint Project",
      voucherNumber,
      notes: notes || `Direct 40% developer revenue share for completed project #${orderId}`,
      expenseDate: nowIso.slice(0, 10),
      createdBy: authResult.uid,
      createdByName: authResult.name,
      createdByEmail: authResult.email,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await db.collection("expenses").add(expenseEntry);

    // 3. Send in-app notification to developer
    try {
      await db.collection("notifications").add({
        title: "💰 Sprint Payout Disbursed!",
        message: `Your 40% revenue share of ₹${amount.toLocaleString()} for project "${orderData.planName}" has been disbursed to your ${paymentMethod.toUpperCase()} (Ref/UTR: ${utrNumber}).`,
        targetType: "user",
        targetUserId: developerId,
        targetEmail: devData.email || null,
        createdAt: nowIso,
        read: false,
      });
    } catch (e) {
      console.warn("Failed to dispatch dev payout notification:", e);
    }

    // 4. Security Audit Log
    await logSecurityEvent({
      action: "finance:disburse_developer_payout",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: orderId,
      status: "success",
      ip: clientIp,
      metadata: { developerId, devName, amount, utrNumber, voucherNumber },
    });

    return NextResponse.json({
      success: true,
      message: `₹${amount.toLocaleString()} payout successfully disbursed to ${devName} and recorded in the General Ledger.`,
      developerPayout,
      voucherNumber,
    });
  } catch (error: any) {
    console.error("Disburse payout error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to disburse payout." }, { status: 500 });
  }
}
