import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DisburseSalarySchema = z.object({
  action: z.literal("disburse_salary"),
  userId: z.string().min(2).max(100),
  amount: z.number().positive(),
  paymentMethod: z.enum(["upi", "bank_transfer", "card", "cash", "other"]).default("upi"),
  utrNumber: z.string().min(3).max(100),
  includedOrderIds: z.array(z.string()).default([]),
  payPeriod: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

const UpdateSalaryConfigSchema = z.object({
  action: z.literal("update_salary_config"),
  userId: z.string().min(2).max(100),
  salaryConfig: z.object({
    type: z.enum(["percentage", "fixed_monthly", "hybrid"]),
    percentage: z.number().min(0).max(100).optional(),
    fixedAmount: z.number().min(0).optional(),
    designationTitle: z.string().max(100).optional(),
    retainerPercentage: z.number().min(0).max(100).optional(),
  }),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthAndPermission(req, Permission.SALARY_READ);
    if (authResult instanceof NextResponse) return authResult;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    // 1. Fetch all users
    const usersSnap = await db.collection("users").get();
    const allUsers: any[] = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Filter staff: developers, admins, or anyone with salary config
    const staffUsers = allUsers.filter(
      (u) => u.role === "developer" || u.role === "admin" || u.role === "super_admin" || !!u.salaryConfig
    );

    // 2. Fetch all orders
    const ordersSnap = await db.collection("orders").get();
    const allOrders: any[] = ordersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 3. Fetch past salary payouts
    const payoutsSnap = await db.collection("salary_payouts").orderBy("disbursedAt", "desc").limit(100).get();
    const pastPayouts: any[] = payoutsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 4. Compute payroll balance per staff member
    let totalPayrollDue = 0;
    let totalDisbursedAllTime = 0;
    let totalEscrowPipeline = 0;

    const staffRoster = staffUsers.map((staff) => {
      const config = staff.salaryConfig || {
        type: staff.role === "developer" ? "percentage" : "fixed_monthly",
        percentage: 40,
        fixedAmount: staff.role === "admin" ? 20000 : 0,
        retainerPercentage: 50,
      };

      const devSharePct = (config.percentage ?? 40) / 100;
      const retainerSharePct = (config.retainerPercentage ?? 50) / 100;

      // Find projects assigned to this developer
      const assignedOrders = allOrders.filter((o) => o.assignedDeveloperId === staff.id);
      const maintenanceOrders = allOrders.filter((o) => o.maintenanceAssignedDevId === staff.id && o.maintenanceActive);

      let unpaidProjectEarnings = 0;
      let paidProjectEarnings = 0;
      let escrowProjectEarnings = 0;
      const unpaidProjectsList: any[] = [];
      const completedProjectsList: any[] = [];

      assignedOrders.forEach((o) => {
        const contractTotal = o.totalPrice || o.price || 0;
        const devAmount = Math.round(contractTotal * devSharePct);
        const isPaid = o.developerPayout?.status === "paid";
        const isCompleted = o.status === "completed" || o.finalPaid;

        if (isPaid) {
          paidProjectEarnings += o.developerPayout?.amount || devAmount;
          completedProjectsList.push({
            orderId: o.id,
            planName: o.planName,
            contractTotal,
            devAmount: o.developerPayout?.amount || devAmount,
            paidAt: o.developerPayout?.paidAt,
            utr: o.developerPayout?.utr,
          });
        } else if (isCompleted) {
          unpaidProjectEarnings += devAmount;
          unpaidProjectsList.push({
            orderId: o.id,
            planName: o.planName,
            contractTotal,
            devAmount,
            status: o.status,
            clientEmail: o.userEmail || o.email,
          });
        } else {
          escrowProjectEarnings += devAmount;
        }
      });

      // Calculate Retainer dues
      let unpaidRetainerEarnings = 0;
      maintenanceOrders.forEach((m) => {
        const monthlyRetainer = m.maintenanceAmount || 1999;
        const devRetainerAmount = Math.round(monthlyRetainer * retainerSharePct);
        if (!m.maintenancePayout?.paid) {
          unpaidRetainerEarnings += devRetainerAmount;
        }
      });

      // Fixed Monthly Salary Component
      const fixedMonthlyDue = config.type === "fixed_monthly" || config.type === "hybrid" ? (config.fixedAmount || 0) : 0;

      const totalAccruedDue = unpaidProjectEarnings + unpaidRetainerEarnings + fixedMonthlyDue;
      const totalPaidOut = paidProjectEarnings;

      totalPayrollDue += totalAccruedDue;
      totalDisbursedAllTime += totalPaidOut;
      totalEscrowPipeline += escrowProjectEarnings;

      return {
        id: staff.id,
        name: staff.name || staff.displayName || "Staff Member",
        email: staff.email,
        role: staff.role || "staff",
        designation: staff.designation || config.designationTitle || (staff.role === "developer" ? "Full-Stack Developer" : "Operations Admin"),
        department: staff.department || "Engineering",
        payoutDetails: staff.payoutDetails || null,
        salaryConfig: config,
        assignedProjectsCount: assignedOrders.length,
        completedProjectsCount: completedProjectsList.length,
        unpaidProjectEarnings,
        unpaidRetainerEarnings,
        fixedMonthlyDue,
        totalAccruedDue,
        totalPaidOut,
        escrowProjectEarnings,
        unpaidProjectsList,
        completedProjectsList,
      };
    });

    // Sort roster by highest unpaid due descending
    staffRoster.sort((a, b) => b.totalAccruedDue - a.totalAccruedDue);

    return NextResponse.json({
      success: true,
      staffRoster,
      pastPayouts,
      summary: {
        totalStaffCount: staffUsers.length,
        totalPayrollDue,
        totalDisbursedAllTime,
        totalEscrowPipeline,
      },
    });
  } catch (error: any) {
    console.error("Fetch salaries roster error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch payroll roster." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.SALARY_MANAGE);
    if (authResult instanceof NextResponse) return authResult;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    const body = await req.json();

    // ── 1. UPDATE SALARY CONFIGURATION ──
    if (body.action === "update_salary_config") {
      const parseResult = UpdateSalaryConfigSchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: "Invalid salary configuration parameters.", details: parseResult.error.flatten() },
          { status: 400 }
        );
      }

      const { userId, salaryConfig } = parseResult.data;
      await db.collection("users").doc(userId).set(
        {
          salaryConfig,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        message: "Staff salary structure updated successfully.",
        salaryConfig,
      });
    }

    // ── 2. DISBURSE SALARY PAYOUT ──
    if (body.action === "disburse_salary") {
      const parseResult = DisburseSalarySchema.safeParse(body);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: "Invalid disbursement parameters.", details: parseResult.error.flatten() },
          { status: 400 }
        );
      }

      const { userId, amount, paymentMethod, utrNumber, includedOrderIds, payPeriod, notes } = parseResult.data;
      const nowIso = new Date().toISOString();

      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return NextResponse.json({ success: false, error: "Staff user not found." }, { status: 404 });
      }

      const staffData = userDoc.data() || {};
      const staffName = staffData.name || staffData.displayName || "Staff Member";
      const staffEmail = staffData.email || "";
      const currentYear = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const voucherNumber = `VCH-SAL-${currentYear}-${randomSuffix}`;
      const salarySlipId = `SLIP-${currentYear}-${randomSuffix}`;

      // A. Update linked orders to mark them as paid
      const orderPromises = includedOrderIds.map(async (orderId) => {
        try {
          const oRef = db.collection("orders").doc(orderId);
          await oRef.update({
            developerPayout: {
              status: "paid",
              paidAt: nowIso,
              utr: utrNumber,
              paymentMethod,
              paidBy: authResult.email,
              voucherNumber,
              salarySlipId,
            },
            updatedAt: nowIso,
          });
        } catch (e) {
          console.warn(`Failed to update order ${orderId} payout state:`, e);
        }
      });
      await Promise.all(orderPromises);

      // B. Save Salary Payout Slip Record
      const salarySlipRecord = {
        id: salarySlipId,
        voucherNumber,
        staffId: userId,
        staffName,
        staffEmail,
        designation: staffData.designation || staffData.salaryConfig?.designationTitle || "Team Member",
        department: staffData.department || "Engineering",
        amount,
        paymentMethod,
        utrNumber,
        payPeriod: payPeriod || new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date()),
        includedOrderIds,
        notes: notes || `Direct salary disbursement via ${paymentMethod.toUpperCase()}`,
        payoutDetails: staffData.payoutDetails || null,
        disbursedByUid: authResult.uid,
        disbursedByName: authResult.name,
        disbursedByEmail: authResult.email,
        disbursedAt: nowIso,
        createdAt: nowIso,
      };

      await db.collection("salary_payouts").doc(salarySlipId).set(salarySlipRecord);

      // C. Post Debit Entry to General Ledger / expenses collection
      const expenseEntry = {
        title: `Staff Salary & Payout: ${staffName} (${payPeriod || "Current Cycle"})`,
        amount,
        category: "developer_payout",
        payee: staffName,
        payeeEmail: staffEmail,
        paymentMethod,
        referenceNumber: utrNumber,
        voucherNumber,
        salarySlipId,
        notes: notes || `Salary disbursement of ₹${amount.toLocaleString()} to ${staffName}`,
        expenseDate: nowIso.slice(0, 10),
        createdBy: authResult.uid,
        createdByName: authResult.name,
        createdByEmail: authResult.email,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await db.collection("expenses").add(expenseEntry);

      // D. Send Notification to Staff Member
      try {
        await db.collection("notifications").add({
          title: "💵 Salary Disbursed & Pay Slip Generated!",
          message: `Your salary payout of ₹${amount.toLocaleString()} has been disbursed to your ${paymentMethod.toUpperCase()} (UTR: ${utrNumber}). Salary Slip #${salarySlipId} is available in your account.`,
          targetType: "user",
          targetUserId: userId,
          targetEmail: staffEmail,
          createdAt: nowIso,
          read: false,
        });
      } catch (e) {
        console.warn("Failed to dispatch staff notification:", e);
      }

      // E. Security Audit Log
      await logSecurityEvent({
        action: "finance:disburse_salary",
        actorUid: authResult.uid,
        actorEmail: authResult.email,
        actorRole: authResult.role,
        resourceId: salarySlipId,
        status: "success",
        ip: clientIp,
        metadata: { staffId: userId, staffName, amount, utrNumber, voucherNumber, includedOrderIds },
      });

      return NextResponse.json({
        success: true,
        message: `₹${amount.toLocaleString()} salary successfully disbursed to ${staffName}.`,
        salarySlip: salarySlipRecord,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Disburse salary error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to disburse salary." }, { status: 500 });
  }
}
