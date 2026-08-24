"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Download,
  Printer,
  Plus,
  Search,
  Filter,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  FileSpreadsheet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Briefcase,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { safeFetchJson } from "@/lib/safeFetch";

interface FinancialLedgerPanelProps {
  orders: any[];
  users: any[];
  currentUser: any;
  isSuperAdmin: boolean;
}

interface ExpenseEntry {
  id: string;
  title: string;
  amount: number;
  category: string;
  payee: string;
  payeeEmail?: string;
  paymentMethod: string;
  referenceNumber?: string;
  orderId?: string;
  projectPlan?: string;
  notes?: string;
  expenseDate: string;
  voucherNumber: string;
  createdByName?: string;
  createdAt: string;
}

interface LedgerTransaction {
  id: string;
  date: Date;
  dateStr: string;
  voucherId: string;
  type: "inflow" | "outflow";
  category: string;
  entityName: string;
  entityEmail?: string;
  planName?: string;
  channel: string;
  reference: string;
  amount: number;
  status: "verified" | "pending" | "due";
}

const CATEGORY_LABELS: Record<string, string> = {
  developer_payout: "Developer Contractor Payout",
  cloud_infrastructure: "Cloud & Infrastructure (Firebase / Vercel)",
  software_licenses: "Software Licenses & Tooling",
  marketing_advertising: "Marketing & Client Acquisition",
  domain_hosting: "Domain & SSL Provisioning",
  office_operational: "Office & Operations",
  tax_compliance: "Taxes & Compliance",
  miscellaneous: "Miscellaneous Overhead",
};

export default function FinancialLedgerPanel({
  orders,
  users,
  currentUser,
  isSuperAdmin,
}: FinancialLedgerPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ledger" | "statement" | "expenses">("ledger");
  const [timeframe, setTimeframe] = useState<"all" | "this_month" | "last_month" | "ytd">("all");
  const [ledgerFilter, setLedgerFilter] = useState<"all" | "inflows" | "outflows" | "advance" | "final" | "maintenance">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Expenses State
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "developer_payout" as string,
    payee: "",
    payeeEmail: "",
    paymentMethod: "upi" as string,
    referenceNumber: "",
    orderId: "",
    projectPlan: "",
    notes: "",
    expenseDate: new Date().toISOString().slice(0, 10),
  });

  // Fetch logged expenses on mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const token = await currentUser?.getIdToken();
      const res = await safeFetchJson<any>("/api/admin/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && res.data?.success) {
        setExpenses(res.data.expenses || []);
      }
    } catch (e) {
      console.warn("Failed to load expenses:", e);
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Handler: Create Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title.trim() || !expenseForm.amount || !expenseForm.payee.trim()) {
      alert("Please fill in the title, amount, and payee.");
      return;
    }

    const numAmount = parseFloat(expenseForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid positive expense amount.");
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const token = await currentUser?.getIdToken();
      const res = await safeFetchJson<any>("/api/admin/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...expenseForm,
          amount: numAmount,
        }),
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || "Failed to record expense");
      }

      setExpenses((prev) => [res.data.expense, ...prev]);
      setShowAddExpenseModal(false);
      setExpenseForm({
        title: "",
        amount: "",
        category: "developer_payout",
        payee: "",
        payeeEmail: "",
        paymentMethod: "upi",
        referenceNumber: "",
        orderId: "",
        projectPlan: "",
        notes: "",
        expenseDate: new Date().toISOString().slice(0, 10),
      });
      alert("Expense recorded in the General Ledger!");
    } catch (err: any) {
      console.error("Create expense error:", err);
      alert(err.message || "Failed to record expense.");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Handler: Delete Expense
  const handleDeleteExpense = async (expenseId: string, voucherNumber: string) => {
    if (!confirm(`Are you sure you want to delete expense voucher ${voucherNumber}? This cannot be undone.`)) {
      return;
    }

    try {
      const token = await currentUser?.getIdToken();
      const res = await safeFetchJson<any>(`/api/admin/expenses?id=${expenseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || "Failed to delete expense");
      }

      setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
      alert("Expense voucher deleted.");
    } catch (err: any) {
      console.error("Delete expense error:", err);
      alert(err.message || "Failed to delete expense");
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // COMPILE MASTER GENERAL LEDGER TRANSACTIONS
  // ══════════════════════════════════════════════════════════════════
  const allTransactions: LedgerTransaction[] = useMemo(() => {
    const list: LedgerTransaction[] = [];

    // 1. Process Orders for Inflows
    orders.forEach((o) => {
      const totalAmount = o.totalPrice || o.price || 0;
      const advanceAmount = o.advancePrice || Math.round(totalAmount * 0.5);
      const finalAmount = o.finalPrice || (totalAmount - advanceAmount);

      const isAdvancePaid = o.advancePaid || o.status === "in_progress" || o.status === "testing" || o.status === "staging_deployed" || o.status === "awaiting_final_payment" || o.status === "completed";
      const isFinalPaid = o.finalPaid || o.status === "completed";

      const createdDate = o.createdAt?._seconds
        ? new Date(o.createdAt._seconds * 1000)
        : o.createdAt?.seconds
        ? new Date(o.createdAt.seconds * 1000)
        : typeof o.createdAt === "string"
        ? new Date(o.createdAt)
        : new Date();

      // Transaction A: 50% Advance Booking Deposit
      if (advanceAmount > 0) {
        list.push({
          id: `ADV-${o.id}`,
          date: createdDate,
          dateStr: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(createdDate),
          voucherId: `RNX-ADV-${o.id.slice(-6).toUpperCase()}`,
          type: "inflow",
          category: "Project 50% Advance Deposit",
          entityName: o.formData?.name || o.userName || o.userEmail || "Client",
          entityEmail: o.userEmail || o.email,
          planName: o.planName || "Project Sprint",
          channel: o.paymentMethod === "paytm_gateway" ? "Paytm Online Gateway" : "Direct UPI Manual",
          reference: o.advancePaymentId || o.utrNumber || "Verified Deposit",
          amount: advanceAmount,
          status: isAdvancePaid ? "verified" : o.status === "awaiting_verification" ? "pending" : "due",
        });
      }

      // Transaction B: 50% Final Handover Settlement
      if (finalAmount > 0 && (isFinalPaid || o.status === "awaiting_final_payment" || o.status === "awaiting_verification")) {
        const finalDate = o.finalPaidAt ? new Date(o.finalPaidAt) : createdDate;
        list.push({
          id: `FIN-${o.id}`,
          date: finalDate,
          dateStr: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(finalDate),
          voucherId: `RNX-FIN-${o.id.slice(-6).toUpperCase()}`,
          type: "inflow",
          category: "Project 50% Final Handover Settlement",
          entityName: o.formData?.name || o.userName || o.userEmail || "Client",
          entityEmail: o.userEmail || o.email,
          planName: o.planName || "Project Sprint",
          channel: o.finalPaymentMethod === "paytm_gateway" ? "Paytm Online Gateway" : "Direct UPI Manual",
          reference: o.finalPaymentId || o.finalUtrNumber || o.utrNumber || (isFinalPaid ? "Settled" : "Awaiting Clearance"),
          amount: finalAmount,
          status: isFinalPaid ? "verified" : "pending",
        });
      }

      // Transaction C: Maintenance Retainer Subscription
      if (o.maintenanceActive && (o.maintenancePaid || o.maintenanceAmount)) {
        const maintDate = o.maintenancePaidAt ? new Date(o.maintenancePaidAt) : createdDate;
        list.push({
          id: `MNT-${o.id}`,
          date: maintDate,
          dateStr: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(maintDate),
          voucherId: `RNX-MNT-${o.id.slice(-6).toUpperCase()}`,
          type: "inflow",
          category: "Website Maintenance & SLA Retainer",
          entityName: o.formData?.name || o.userName || o.userEmail || "Client",
          entityEmail: o.userEmail || o.email,
          planName: `${o.planName} Maintenance`,
          channel: "Monthly Subscription / Retainer",
          reference: o.maintenanceUtr || "Active Retainer",
          amount: o.maintenanceAmount || 1999,
          status: "verified",
        });
      }
    });

    // 2. Process Expenses for Outflows
    expenses.forEach((exp) => {
      const expDate = exp.expenseDate ? new Date(exp.expenseDate) : new Date(exp.createdAt);
      list.push({
        id: `EXP-${exp.id}`,
        date: expDate,
        dateStr: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(expDate),
        voucherId: exp.voucherNumber || `VCH-${exp.id.slice(-6).toUpperCase()}`,
        type: "outflow",
        category: CATEGORY_LABELS[exp.category] || exp.title,
        entityName: exp.payee,
        entityEmail: exp.payeeEmail,
        planName: exp.projectPlan || exp.title,
        channel: exp.paymentMethod?.toUpperCase() || "UPI",
        reference: exp.referenceNumber || "Direct Outflow",
        amount: exp.amount,
        status: "verified",
      });
    });

    // Sort by date descending
    list.sort((a, b) => b.date.getTime() - a.date.getTime());
    return list;
  }, [orders, expenses]);

  // ══════════════════════════════════════════════════════════════════
  // FILTERED LEDGER & FINANCIAL AGGREGATIONS
  // ══════════════════════════════════════════════════════════════════
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return allTransactions.filter((tx) => {
      // 1. Timeframe Filter
      if (timeframe === "this_month") {
        if (tx.date.getMonth() !== currentMonth || tx.date.getFullYear() !== currentYear) {
          return false;
        }
      } else if (timeframe === "last_month") {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (tx.date.getMonth() !== lastMonth || tx.date.getFullYear() !== lastMonthYear) {
          return false;
        }
      } else if (timeframe === "ytd") {
        if (tx.date.getFullYear() !== currentYear) return false;
      }

      // 2. Category / Ledger Type Filter
      if (ledgerFilter === "inflows" && tx.type !== "inflow") return false;
      if (ledgerFilter === "outflows" && tx.type !== "outflow") return false;
      if (ledgerFilter === "advance" && !tx.category.includes("Advance")) return false;
      if (ledgerFilter === "final" && !tx.category.includes("Final")) return false;
      if (ledgerFilter === "maintenance" && !tx.category.includes("Maintenance")) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = tx.entityName?.toLowerCase().includes(q);
        const matchesEmail = tx.entityEmail?.toLowerCase().includes(q);
        const matchesVoucher = tx.voucherId?.toLowerCase().includes(q);
        const matchesRef = tx.reference?.toLowerCase().includes(q);
        const matchesPlan = tx.planName?.toLowerCase().includes(q);
        const matchesCategory = tx.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesVoucher && !matchesRef && !matchesPlan && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [allTransactions, timeframe, ledgerFilter, searchQuery]);

  // ══════════════════════════════════════════════════════════════════
  // FINANCIAL METRICS CALCULATION (P&L KPIs)
  // ══════════════════════════════════════════════════════════════════
  const metrics = useMemo(() => {
    let grossInflow = 0;
    let advanceCollected = 0;
    let finalCollected = 0;
    let maintenanceRevenue = 0;
    let accountsReceivable = 0;
    let totalExpenses = 0;
    let devPayouts = 0;
    let infraCosts = 0;

    allTransactions.forEach((tx) => {
      if (tx.type === "inflow") {
        if (tx.status === "verified") {
          grossInflow += tx.amount;
          if (tx.category.includes("Advance")) advanceCollected += tx.amount;
          if (tx.category.includes("Final")) finalCollected += tx.amount;
          if (tx.category.includes("Maintenance")) maintenanceRevenue += tx.amount;
        } else if (tx.status === "due" || tx.status === "pending") {
          accountsReceivable += tx.amount;
        }
      } else if (tx.type === "outflow") {
        totalExpenses += tx.amount;
        if (tx.category.includes("Developer")) devPayouts += tx.amount;
        if (tx.category.includes("Cloud") || tx.category.includes("Infrastructure")) infraCosts += tx.amount;
      }
    });

    const netProfit = grossInflow - totalExpenses;
    const profitMargin = grossInflow > 0 ? ((netProfit / grossInflow) * 100).toFixed(1) : "0.0";
    const totalOrdersCount = orders.length;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(grossInflow / totalOrdersCount) : 0;

    return {
      grossInflow,
      advanceCollected,
      finalCollected,
      maintenanceRevenue,
      accountsReceivable,
      totalExpenses,
      devPayouts,
      infraCosts,
      netProfit,
      profitMargin,
      totalOrdersCount,
      avgOrderValue,
    };
  }, [allTransactions, orders]);

  // ══════════════════════════════════════════════════════════════════
  // EXPORT TOOLS: CSV & FINANCIAL STATEMENT PRINT
  // ══════════════════════════════════════════════════════════════════
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No ledger records to export.");
      return;
    }

    const headers = [
      "Voucher ID",
      "Date",
      "Type",
      "Category",
      "Client / Payee",
      "Email",
      "Project Plan",
      "Payment Channel",
      "Reference / UTR",
      "Credit (+ INR)",
      "Debit (- INR)",
      "Status",
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.voucherId,
      tx.dateStr,
      tx.type.toUpperCase(),
      `"${tx.category.replace(/"/g, '""')}"`,
      `"${tx.entityName.replace(/"/g, '""')}"`,
      tx.entityEmail || "N/A",
      `"${(tx.planName || "").replace(/"/g, '""')}"`,
      `"${tx.channel.replace(/"/g, '""')}"`,
      `"${tx.reference.replace(/"/g, '""')}"`,
      tx.type === "inflow" && tx.status === "verified" ? tx.amount : "0",
      tx.type === "outflow" ? tx.amount : "0",
      tx.status.toUpperCase(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RUNIX_LEDGER_EXPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summary = `📊 RUNIX WEBTECH FINANCIAL P&L SUMMARY (${new Date().toLocaleDateString("en-IN")})
══════════════════════════════════════════════════
• Gross Revenue Collected: ₹${metrics.grossInflow.toLocaleString()}
  - 50% Advance Deposits:   ₹${metrics.advanceCollected.toLocaleString()}
  - 50% Final Settlements:  ₹${metrics.finalCollected.toLocaleString()}
  - Maintenance Retainers:  ₹${metrics.maintenanceRevenue.toLocaleString()}
• Total Operational Costs: ₹${metrics.totalExpenses.toLocaleString()}
  - Developer Payouts:      ₹${metrics.devPayouts.toLocaleString()}
  - Cloud Infrastructure:   ₹${metrics.infraCosts.toLocaleString()}
══════════════════════════════════════════════════
• NET PROFIT (EBITDA):     ₹${metrics.netProfit.toLocaleString()} (${metrics.profitMargin}% Net Margin)
• Accounts Receivable:     ₹${metrics.accountsReceivable.toLocaleString()} (Pending Handover)
• Total Project Volume:    ${metrics.totalOrdersCount} Projects`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* ── HEADER & QUICK ACTION BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" /> Financial P&L & Accounts Ledger
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Audited Real-Time
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Track revenue inflows, developer payouts, operational overhead, and export accounting ledger statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setShowAddExpenseModal(true)}
            variant="accent"
            size="sm"
            className="rounded-xl flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Log Expense / Dev Payout
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="rounded-xl flex items-center gap-1.5 text-xs bg-white/[0.02] hover:bg-white/5 border-white/10"
            title="Download General Ledger as CSV for Excel / Tally"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </Button>

          <Button
            onClick={handleCopySummary}
            variant="outline"
            size="sm"
            className="rounded-xl flex items-center gap-1.5 text-xs bg-white/[0.02] hover:bg-white/5 border-white/10"
            title="Copy Financial P&L Summary to Clipboard"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSummary ? "Copied!" : "Copy Summary"}
          </Button>

          <Button
            onClick={handlePrintStatement}
            variant="outline"
            size="sm"
            className="rounded-xl flex items-center gap-1.5 text-xs bg-white/[0.02] hover:bg-white/5 border-white/10"
            title="Print Official Financial Statement"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" /> Print Statement
          </Button>
        </div>
      </div>

      {/* ── EXECUTIVE P&L KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Inflow / Total Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-[#0e0e0e] to-black border border-emerald-500/20 space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Gross Inflow (Collected)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ₹{metrics.grossInflow.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
              <span>Adv: ₹{metrics.advanceCollected.toLocaleString()}</span>
              <span>•</span>
              <span>Final: ₹{metrics.finalCollected.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Operating Expenses & Outflows */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-red-950/30 via-[#0e0e0e] to-black border border-red-500/20 space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Total Outflows & Costs</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ₹{metrics.totalExpenses.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
              <span>Payouts: ₹{metrics.devPayouts.toLocaleString()}</span>
              <span>•</span>
              <span>Infra: ₹{metrics.infraCosts.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Net Operating Profit */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-[#0e0e0e] to-black border border-indigo-500/20 space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Net Operating Profit</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className={`text-2xl sm:text-3xl font-black tracking-tight ${metrics.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ₹{metrics.netProfit.toLocaleString()}
            </p>
            <p className="text-[11px] text-indigo-300 mt-1 font-mono">
              {metrics.profitMargin}% Net Margin ({metrics.totalOrdersCount} Projects)
            </p>
          </div>
        </div>

        {/* Card 4: Accounts Receivable (Pipeline Inflow) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-[#0e0e0e] to-black border border-amber-500/20 space-y-3 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Receivables (At Handover)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ₹{metrics.accountsReceivable.toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-300 mt-1 font-medium">
              Due on Staging Delivery & Handover
            </p>
          </div>
        </div>
      </div>

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("ledger")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activeSubTab === "ledger"
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                : "bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> General Ledger ({filteredTransactions.length})
          </button>

          <button
            onClick={() => setActiveSubTab("statement")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activeSubTab === "statement"
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                : "bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white"
            }`}
          >
            <PieChart className="w-3.5 h-3.5" /> Formal P&L Statement
          </button>

          <button
            onClick={() => setActiveSubTab("expenses")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activeSubTab === "expenses"
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                : "bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Outflows & Payouts ({expenses.length})
          </button>
        </div>

        {/* Timeframe Filter Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl">
          {[
            { id: "all", label: "All Time" },
            { id: "this_month", label: "This Month" },
            { id: "last_month", label: "Last Month" },
            { id: "ytd", label: "YTD" },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id as any)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                timeframe === tf.id ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB 1: GENERAL FINANCIAL LEDGER ── */}
      {activeSubTab === "ledger" && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "All Records" },
                { id: "inflows", label: "Inflows Only (+)" },
                { id: "outflows", label: "Outflows Only (-)" },
                { id: "advance", label: "50% Advances" },
                { id: "final", label: "Final Settlements" },
                { id: "maintenance", label: "Maintenance" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setLedgerFilter(filter.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ledgerFilter === filter.id
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                      : "bg-white/[0.02] text-zinc-400 border-white/5 hover:border-white/15"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledger by client, UTR, voucher..."
                className="w-full bg-[#141416] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Voucher / Date</th>
                    <th className="py-3.5 px-4 font-semibold">Category / Purpose</th>
                    <th className="py-3.5 px-4 font-semibold">Party / Client</th>
                    <th className="py-3.5 px-4 font-semibold">Channel & Ref</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Credit (+)</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Debit (-)</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        No financial transactions matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isCredit = tx.type === "inflow";
                      return (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors font-mono text-[11px]">
                          {/* Voucher / Date */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-white block">{tx.voucherId}</span>
                            <span className="text-[10px] text-zinc-500">{tx.dateStr}</span>
                          </td>

                          {/* Category / Purpose */}
                          <td className="py-3 px-4 font-sans">
                            <span className="text-zinc-200 font-medium block">{tx.category}</span>
                            {tx.planName && <span className="text-[10px] text-zinc-500 font-mono">{tx.planName}</span>}
                          </td>

                          {/* Party / Client */}
                          <td className="py-3 px-4 font-sans">
                            <span className="text-white font-medium block truncate max-w-[150px]">{tx.entityName}</span>
                            {tx.entityEmail && <span className="text-[10px] text-zinc-500 truncate block max-w-[150px]">{tx.entityEmail}</span>}
                          </td>

                          {/* Channel & Reference */}
                          <td className="py-3 px-4">
                            <span className="text-zinc-300 block">{tx.channel}</span>
                            <span className="text-[10px] text-indigo-300 truncate max-w-[140px] block" title={tx.reference}>
                              {tx.reference}
                            </span>
                          </td>

                          {/* Credit (+) */}
                          <td className="py-3 px-4 text-right">
                            {isCredit && tx.status === "verified" ? (
                              <span className="text-emerald-400 font-bold">+₹{tx.amount.toLocaleString()}</span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>

                          {/* Debit (-) */}
                          <td className="py-3 px-4 text-right">
                            {!isCredit ? (
                              <span className="text-red-400 font-bold">-₹{tx.amount.toLocaleString()}</span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-sans border ${
                                tx.status === "verified"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : tx.status === "pending"
                                  ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: FORMAL PROFIT & LOSS STATEMENT ── */}
      {activeSubTab === "statement" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0e0e0e] border border-white/10 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <h3 className="text-lg font-black text-white font-jakarta">RUNIX WEBTECH — FINANCIAL STATEMENT</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Profit & Loss Account · Period: {timeframe.replace(/_/g, " ").toUpperCase()} (INR)
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-500 font-mono">Statement ID: #STMT-{new Date().getFullYear()}-{metrics.totalOrdersCount}</span>
            </div>
          </div>

          <div className="space-y-6 text-xs font-mono">
            {/* 1. Operating Revenue */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-emerald-500/10 rounded-lg text-emerald-400 font-bold">
                <span>1. OPERATING REVENUE (INFLOWS)</span>
                <span>₹{metrics.grossInflow.toLocaleString()}</span>
              </div>
              <div className="pl-4 pr-3 space-y-1.5 text-zinc-300">
                <div className="flex justify-between">
                  <span>• Milestone 1: Project 50% Advance Deposits</span>
                  <span>₹{metrics.advanceCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Milestone 2: Project 50% Final Handover Settlements</span>
                  <span>₹{metrics.finalCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Website Maintenance & SLA Retainers</span>
                  <span>₹{metrics.maintenanceRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 2. Direct Costs & COGS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-red-500/10 rounded-lg text-red-400 font-bold">
                <span>2. DIRECT COSTS & DEVELOPER DISBURSEMENTS</span>
                <span>(₹{metrics.devPayouts.toLocaleString()})</span>
              </div>
              <div className="pl-4 pr-3 space-y-1.5 text-zinc-300">
                <div className="flex justify-between">
                  <span>• Developer Contractor Disbursements</span>
                  <span>(₹{metrics.devPayouts.toLocaleString()})</span>
                </div>
              </div>
            </div>

            {/* 3. Operating Overhead (OPEX) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 px-3 bg-amber-500/10 rounded-lg text-amber-400 font-bold">
                <span>3. OPERATING OVERHEAD (OPEX)</span>
                <span>(₹{(metrics.totalExpenses - metrics.devPayouts).toLocaleString()})</span>
              </div>
              <div className="pl-4 pr-3 space-y-1.5 text-zinc-300">
                <div className="flex justify-between">
                  <span>• Cloud Infrastructure & Server Hosting</span>
                  <span>(₹{metrics.infraCosts.toLocaleString()})</span>
                </div>
                <div className="flex justify-between">
                  <span>• Software, Tooling & Miscellaneous Overhead</span>
                  <span>(₹{(metrics.totalExpenses - metrics.devPayouts - metrics.infraCosts).toLocaleString()})</span>
                </div>
              </div>
            </div>

            {/* Net Operating Income Result */}
            <div className="pt-4 border-t-2 border-white/20">
              <div className="flex justify-between items-center py-3 px-4 bg-white/5 rounded-xl text-base font-black text-white">
                <span className="font-jakarta">NET OPERATING INCOME (EBITDA / PROFIT):</span>
                <span className={metrics.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}>
                  ₹{metrics.netProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 pt-2 text-[11px] text-zinc-400">
                <span>Net Profit Margin: <strong className="text-white">{metrics.profitMargin}%</strong></span>
                <span>Pipeline Receivables (Uncollected): <strong className="text-amber-400">₹{metrics.accountsReceivable.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: EXPENSES & DEVELOPER PAYOUTS MANAGER ── */}
      {activeSubTab === "expenses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Logged Expenses & Disbursements ({expenses.length})</h3>
            <Button
              onClick={() => setShowAddExpenseModal(true)}
              variant="accent"
              size="sm"
              className="rounded-xl text-xs flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500"
            >
              <Plus className="w-3.5 h-3.5" /> Log New Expense
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenses.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-zinc-500 bg-white/[0.01] border border-white/5 rounded-2xl">
                No operating expenses logged yet. Click &quot;Log New Expense&quot; to record developer payouts, server costs, or tooling.
              </div>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3 relative group hover:border-white/20 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        {CATEGORY_LABELS[exp.category] || exp.category}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">{exp.title}</h4>
                      <p className="text-xs text-zinc-400">
                        Payee: <strong className="text-white">{exp.payee}</strong>
                        {exp.payeeEmail ? ` (${exp.payeeEmail})` : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-black text-red-400 font-mono">
                        -₹{exp.amount.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-zinc-500 font-mono">{exp.voucherNumber}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Date: {exp.expenseDate} · Ref: {exp.referenceNumber || "N/A"}</span>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.voucherNumber)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Delete expense voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: LOG NEW EXPENSE / DEV PAYOUT ── */}
      <AnimatePresence>
        {showAddExpenseModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              onClick={() => setShowAddExpenseModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#111] border border-white/15 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Log Operating Expense / Payout</h3>
                      <p className="text-xs text-zinc-400">Record an outflow transaction into the General Ledger</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddExpenseModal(false)}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
                  <div>
                    <label className="text-zinc-300 font-semibold mb-1 block">
                      Expense Title / Purpose <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={expenseForm.title}
                      onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                      placeholder="e.g. Sprint Payout for Enterprise MVP Client Project"
                      className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-300 font-semibold mb-1 block">
                        Amount (₹ INR) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        placeholder="e.g. 8000"
                        className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-300 font-semibold mb-1 block">
                        Category <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                        className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 font-medium"
                      >
                        <option value="developer_payout">Developer Payout</option>
                        <option value="cloud_infrastructure">Cloud Infrastructure (Firebase/Vercel)</option>
                        <option value="software_licenses">Software Licenses & Tools</option>
                        <option value="marketing_advertising">Marketing & Ads</option>
                        <option value="domain_hosting">Domain & SSL</option>
                        <option value="office_operational">Office & Operations</option>
                        <option value="miscellaneous">Miscellaneous</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-300 font-semibold mb-1 block">
                        Payee Name / Vendor <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={expenseForm.payee}
                        onChange={(e) => setExpenseForm({ ...expenseForm, payee: e.target.value })}
                        placeholder="e.g. Aditya_Clint / Vercel Inc"
                        className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-300 font-semibold mb-1 block">Payment Channel</label>
                      <select
                        value={expenseForm.paymentMethod}
                        onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                        className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 font-medium"
                      >
                        <option value="upi">Direct UPI Transfer</option>
                        <option value="bank_transfer">Bank NEFT / IMPS</option>
                        <option value="card">Company Debit / Credit Card</option>
                        <option value="cash">Cash Outflow</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-300 font-semibold mb-1 block">UTR / Txn Reference (Optional)</label>
                      <input
                        type="text"
                        value={expenseForm.referenceNumber}
                        onChange={(e) => setExpenseForm({ ...expenseForm, referenceNumber: e.target.value })}
                        placeholder="e.g. UPI/123456789123"
                        className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-300 font-semibold mb-1 block">Expense Date</label>
                      <input
                        type="date"
                        value={expenseForm.expenseDate}
                        onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                        className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <Button
                      type="button"
                      onClick={() => setShowAddExpenseModal(false)}
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="accent"
                      size="sm"
                      disabled={isSubmittingExpense}
                      className="rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white"
                    >
                      {isSubmittingExpense ? "Recording..." : "Record in Ledger"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
