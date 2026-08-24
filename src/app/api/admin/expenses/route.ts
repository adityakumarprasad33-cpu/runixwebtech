import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CreateExpenseSchema = z.object({
  title: z.string().min(2).max(150),
  amount: z.number().positive(),
  category: z.enum([
    "developer_payout",
    "cloud_infrastructure",
    "software_licenses",
    "marketing_advertising",
    "domain_hosting",
    "office_operational",
    "tax_compliance",
    "miscellaneous",
  ]),
  payee: z.string().min(2).max(100),
  payeeEmail: z.string().email().optional().or(z.literal("")),
  paymentMethod: z.enum(["bank_transfer", "upi", "card", "cash", "crypto", "other"]).default("upi"),
  referenceNumber: z.string().max(100).optional(),
  orderId: z.string().max(100).optional(),
  projectPlan: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  expenseDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthAndPermission(req, Permission.FINANCIAL_READ);
    if (authResult instanceof NextResponse) return authResult;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    const snap = await db.collection("expenses").orderBy("createdAt", "desc").limit(200).get();
    const expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ success: true, expenses });
  } catch (error: any) {
    console.error("Fetch expenses error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch expenses." }, { status: 500 });
  }
}

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
    const parseResult = CreateExpenseSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid expense parameters.", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const expenseData = parseResult.data;
    const nowIso = new Date().toISOString();

    const voucherNumber = `VCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newExpense = {
      ...expenseData,
      voucherNumber,
      createdBy: authResult.uid,
      createdByName: authResult.name,
      createdByEmail: authResult.email,
      expenseDate: expenseData.expenseDate || nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const docRef = await db.collection("expenses").add(newExpense);

    await logSecurityEvent({
      action: "finance:create_expense",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: docRef.id,
      status: "success",
      ip: clientIp,
      metadata: { amount: expenseData.amount, category: expenseData.category, voucherNumber },
    });

    return NextResponse.json({
      success: true,
      message: "Expense entry recorded in general ledger.",
      expense: { id: docRef.id, ...newExpense },
    });
  } catch (error: any) {
    console.error("Create expense error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to record expense." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.EXPENSE_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get("id");

    if (!expenseId) {
      return NextResponse.json({ success: false, error: "Missing expense ID." }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    const docRef = db.collection("expenses").doc(expenseId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ success: false, error: "Expense not found." }, { status: 404 });
    }

    const data = docSnap.data();
    await docRef.delete();

    await logSecurityEvent({
      action: "finance:delete_expense",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: expenseId,
      status: "success",
      ip: clientIp,
      metadata: { amount: data?.amount, voucherNumber: data?.voucherNumber },
    });

    return NextResponse.json({ success: true, message: "Expense record deleted." });
  } catch (error: any) {
    console.error("Delete expense error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete expense." }, { status: 500 });
  }
}
