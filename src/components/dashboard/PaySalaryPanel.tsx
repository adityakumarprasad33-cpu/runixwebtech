"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  DollarSign,
  QrCode,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  CreditCard,
  Printer,
  X,
  FileText,
  UserCheck,
  ShieldCheck,
  Briefcase,
  Sparkles,
  Settings2,
  ArrowUpRight,
  TrendingUp,
  History,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { safeFetchJson } from "@/lib/safeFetch";

interface PaySalaryPanelProps {
  currentUser: any;
  isSuperAdmin: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  department: string;
  payoutDetails?: {
    type: "upi" | "bank";
    upiId?: string;
    upiName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  } | null;
  salaryConfig: {
    type: "percentage" | "fixed_monthly" | "hybrid";
    percentage?: number;
    fixedAmount?: number;
    designationTitle?: string;
    retainerPercentage?: number;
  };
  assignedProjectsCount: number;
  completedProjectsCount: number;
  unpaidProjectEarnings: number;
  unpaidRetainerEarnings: number;
  fixedMonthlyDue: number;
  totalAccruedDue: number;
  totalPaidOut: number;
  escrowProjectEarnings: number;
  unpaidProjectsList: any[];
  completedProjectsList: any[];
}

interface SalaryPayoutSlip {
  id: string;
  voucherNumber: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  designation: string;
  department: string;
  amount: number;
  paymentMethod: string;
  utrNumber: string;
  payPeriod: string;
  includedOrderIds: string[];
  notes?: string;
  disbursedByName: string;
  disbursedAt: string;
}

export default function PaySalaryPanel({ currentUser, isSuperAdmin }: PaySalaryPanelProps) {
  const [activeView, setActiveView] = useState<"roster" | "history">("roster");
  const [staffRoster, setStaffRoster] = useState<StaffMember[]>([]);
  const [pastPayouts, setPastPayouts] = useState<SalaryPayoutSlip[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalStaffCount: 0,
    totalPayrollDue: 0,
    totalDisbursedAllTime: 0,
    totalEscrowPipeline: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "developer" | "admin" | "unpaid_only">("all");

  // Modal States
  const [payingStaff, setPayingStaff] = useState<StaffMember | null>(null);
  const [disburseUtr, setDisburseUtr] = useState("");
  const [disburseMethod, setDisburseMethod] = useState<"upi" | "bank_transfer">("upi");
  const [payPeriodInput, setPayPeriodInput] = useState(
    new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date())
  );
  const [disburseNotes, setDisburseNotes] = useState("");
  const [isDisbursing, setIsDisbursing] = useState(false);

  // Salary Slip Modal
  const [activeSlip, setActiveSlip] = useState<SalaryPayoutSlip | null>(null);

  // Config Modal
  const [editingStaffConfig, setEditingStaffConfig] = useState<StaffMember | null>(null);
  const [configType, setConfigType] = useState<"percentage" | "fixed_monthly" | "hybrid">("percentage");
  const [configPercentage, setConfigPercentage] = useState("40");
  const [configFixedAmount, setConfigFixedAmount] = useState("20000");
  const [configDesignation, setConfigDesignation] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      const res = await safeFetchJson<any>("/api/admin/salaries", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok && res.data?.success) {
        setStaffRoster(res.data.staffRoster || []);
        setPastPayouts(res.data.pastPayouts || []);
        if (res.data.summary) setSummaryMetrics(res.data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch payroll data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return staffRoster.filter((staff) => {
      if (roleFilter === "developer" && staff.role !== "developer") return false;
      if (roleFilter === "admin" && staff.role !== "admin" && staff.role !== "super_admin") return false;
      if (roleFilter === "unpaid_only" && staff.totalAccruedDue <= 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = staff.name.toLowerCase().includes(q);
        const matchesEmail = staff.email.toLowerCase().includes(q);
        const matchesRole = staff.role.toLowerCase().includes(q);
        const matchesDesig = staff.designation?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesRole && !matchesDesig) return false;
      }
      return true;
    });
  }, [staffRoster, roleFilter, searchQuery]);

  // Execute Salary Disbursement
  const handleConfirmDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingStaff) return;
    if (!disburseUtr.trim()) {
      alert("Please enter the payment UTR or Transaction Reference number.");
      return;
    }

    setIsDisbursing(true);
    try {
      const token = await currentUser?.getIdToken();
      const includedOrderIds = payingStaff.unpaidProjectsList.map((p) => p.orderId);

      const res = await safeFetchJson<any>("/api/admin/salaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "disburse_salary",
          userId: payingStaff.id,
          amount: payingStaff.totalAccruedDue,
          paymentMethod: disburseMethod,
          utrNumber: disburseUtr.trim(),
          includedOrderIds,
          payPeriod: payPeriodInput,
          notes: disburseNotes.trim() || undefined,
        }),
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || "Failed to disburse salary");
      }

      const generatedSlip = res.data.salarySlip;
      setPastPayouts((prev) => [generatedSlip, ...prev]);
      setPayingStaff(null);
      setDisburseUtr("");
      setDisburseNotes("");
      await fetchPayrollData();

      // Show the generated salary slip immediately for printing
      setActiveSlip(generatedSlip);
    } catch (err: any) {
      console.error("Disbursement error:", err);
      alert(err.message || "Failed to disburse salary.");
    } finally {
      setIsDisbursing(false);
    }
  };

  // Save Salary Structure
  const handleSaveSalaryConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffConfig) return;

    setSavingConfig(true);
    try {
      const token = await currentUser?.getIdToken();
      const res = await safeFetchJson<any>("/api/admin/salaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "update_salary_config",
          userId: editingStaffConfig.id,
          salaryConfig: {
            type: configType,
            percentage: parseFloat(configPercentage) || 40,
            fixedAmount: parseFloat(configFixedAmount) || 0,
            designationTitle: configDesignation.trim() || editingStaffConfig.designation,
          },
        }),
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || "Failed to update salary config");
      }

      await fetchPayrollData();
      setEditingStaffConfig(null);
      alert("Staff salary structure updated successfully!");
    } catch (err: any) {
      console.error("Save config error:", err);
      alert(err.message || "Failed to save salary configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" /> Pay Salary & Staff Compensation
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
              Automated Payroll Desk
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage per-role salary structures, calculate 40% developer sprint revenues, and disburse instant UPI/Bank payouts with official salary slips.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setActiveView("roster")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === "roster"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Staff Payroll Roster
          </button>
          <button
            onClick={() => setActiveView("history")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === "history"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" /> Salary Slips History ({pastPayouts.length})
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Accrued Payroll Due */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-[#0e0e0e] to-black border border-cyan-500/20 space-y-2 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Payroll Accrued Due</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight font-mono">
              ₹{summaryMetrics.totalPayrollDue.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">Ready for 1-Click UPI/Bank Pay</p>
          </div>
        </div>

        {/* Card 2: Total Disbursed */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-[#0e0e0e] to-black border border-emerald-500/20 space-y-2 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Disbursed to Date</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono">
              ₹{summaryMetrics.totalDisbursedAllTime.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">{pastPayouts.length} Salary Slips Issued</p>
          </div>
        </div>

        {/* Card 3: Active Staff Count */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-[#0e0e0e] to-black border border-indigo-500/20 space-y-2 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Active Staff & Devs</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {summaryMetrics.totalStaffCount} Members
            </p>
            <p className="text-[11px] text-indigo-300 mt-1">Developers, Admins & Staff</p>
          </div>
        </div>

        {/* Card 4: Escrow Pipeline */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-[#0e0e0e] to-black border border-amber-500/20 space-y-2 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Escrow (In-Flight Sprints)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
              ₹{summaryMetrics.totalEscrowPipeline.toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-300 mt-1">Unlocks upon Handover Settlement</p>
          </div>
        </div>
      </div>

      {/* ── VIEW 1: STAFF PAYROLL ROSTER ── */}
      {activeView === "roster" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "All Staff" },
                { id: "unpaid_only", label: "⚠️ Unpaid Dues Only" },
                { id: "developer", label: "Developers (40% Share)" },
                { id: "admin", label: "Admins & Ops" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setRoleFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    roleFilter === f.id
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : "bg-white/[0.02] text-zinc-400 border-white/5 hover:border-white/15"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, role, email..."
                className="w-full bg-[#141416] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Roster Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredRoster.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 bg-white/[0.01] border border-white/5 rounded-xl">
                No staff members matching the criteria.
              </div>
            ) : (
              filteredRoster.map((staff) => {
                const hasDue = staff.totalAccruedDue > 0;
                const devUpiId = staff.payoutDetails?.upiId;

                return (
                  <div
                    key={staff.id}
                    className={`p-5 sm:p-6 rounded-xl border transition-all shadow-xl space-y-4 ${
                      hasDue
                        ? "bg-gradient-to-r from-[#121214] via-[#0d0d0f] to-black border-cyan-500/25 hover:border-cyan-500/40"
                        : "bg-[#0e0e0e] border-white/5 opacity-90"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Staff Identity & Role */}
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-base shrink-0">
                          {staff.name[0]?.toUpperCase() || "S"}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="text-base font-bold text-white">{staff.name}</h4>
                            <span className="text-[10px] font-mono uppercase bg-white/5 text-zinc-400 px-2 py-0.5 rounded border border-white/10">
                              {staff.role}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium">· {staff.designation}</span>
                          </div>

                          <p className="text-xs text-zinc-400 font-mono">{staff.email}</p>

                          {/* Payout Channel Badge */}
                          <div className="flex items-center gap-2 pt-1">
                            {devUpiId ? (
                              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <QrCode className="w-3 h-3 text-cyan-400" /> UPI: {devUpiId}
                              </span>
                            ) : staff.payoutDetails?.accountNumber ? (
                              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-emerald-400" /> Bank: {staff.payoutDetails.bankName} (A/C: {staff.payoutDetails.accountNumber})
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-medium">
                                ⚠️ No payout details configured
                              </span>
                            )}

                            <span className="text-[10px] font-mono text-zinc-500">
                              · Structure:{" "}
                              {staff.salaryConfig.type === "percentage"
                                ? `${staff.salaryConfig.percentage || 40}% Project Share`
                                : staff.salaryConfig.type === "fixed_monthly"
                                ? `₹${(staff.salaryConfig.fixedAmount || 20000).toLocaleString()}/mo Fixed`
                                : "Hybrid"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Balances & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-white/5">
                        <div className="text-left lg:text-right space-y-0.5">
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Unpaid Accrued Due</p>
                          <p className={`text-2xl font-black font-mono tracking-tight ${hasDue ? "text-cyan-300" : "text-zinc-500"}`}>
                            ₹{staff.totalAccruedDue.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            Disbursed All-Time: ₹{staff.totalPaidOut.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Configure Salary Structure */}
                          <button
                            onClick={() => {
                              setEditingStaffConfig(staff);
                              setConfigType(staff.salaryConfig.type || "percentage");
                              setConfigPercentage(String(staff.salaryConfig.percentage || 40));
                              setConfigFixedAmount(String(staff.salaryConfig.fixedAmount || 20000));
                              setConfigDesignation(staff.designation || "");
                            }}
                            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Configure Salary & Revenue Share Rules"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>

                          {/* 1-Click Pay Salary */}
                          {hasDue ? (
                            <Button
                              onClick={() => {
                                setPayingStaff(staff);
                                setDisburseUtr("");
                                setDisburseNotes("");
                              }}
                              variant="accent"
                              className="rounded-xl h-10 px-5 text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                            >
                              <DollarSign className="w-4 h-4" /> Pay Salary (₹{staff.totalAccruedDue.toLocaleString()})
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> All Settled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Accrued Projects List Breakdown (Expandable if projects exist) */}
                    {staff.unpaidProjectsList.length > 0 && (
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">
                          Completed Sprints Queued for Payout ({staff.unpaidProjectsList.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {staff.unpaidProjectsList.map((p) => (
                            <div key={p.orderId} className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                              <div>
                                <p className="text-white font-semibold truncate max-w-[160px]">{p.planName}</p>
                                <span className="text-[10px] text-zinc-500 font-mono">Contract: ₹{p.contractTotal.toLocaleString()}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-cyan-300 font-mono font-bold block">+₹{p.devAmount.toLocaleString()}</span>
                                <span className="text-[9px] text-emerald-400 uppercase font-bold">40% Share</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── VIEW 2: SALARY SLIPS HISTORY ── */}
      {activeView === "history" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Slip ID / Voucher</th>
                    <th className="py-3.5 px-4 font-semibold">Staff Member</th>
                    <th className="py-3.5 px-4 font-semibold">Pay Period</th>
                    <th className="py-3.5 px-4 font-semibold">Channel & UTR</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Disbursed Amount</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {pastPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        No salary slips issued yet.
                      </td>
                    </tr>
                  ) : (
                    pastPayouts.map((slip) => (
                      <tr key={slip.id} className="hover:bg-white/[0.02] transition-colors font-mono text-[11px]">
                        <td className="py-3 px-4">
                          <span className="font-bold text-cyan-300 block">{slip.id}</span>
                          <span className="text-[10px] text-zinc-500">{slip.voucherNumber}</span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="text-white font-medium block">{slip.staffName}</span>
                          <span className="text-[10px] text-zinc-500">{slip.staffEmail}</span>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">{slip.payPeriod}</td>
                        <td className="py-3 px-4">
                          <span className="text-zinc-200 block uppercase">{slip.paymentMethod}</span>
                          <span className="text-[10px] text-indigo-300 truncate max-w-[130px] block">
                            UTR: {slip.utrNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-emerald-400 font-black text-xs">₹{slip.amount.toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            onClick={() => setActiveSlip(slip)}
                            variant="outline"
                            size="sm"
                            className="rounded-lg h-7 px-2.5 text-[10px] bg-white/[0.02] hover:bg-white/10 border-white/10 flex items-center gap-1 mx-auto"
                          >
                            <Printer className="w-3 h-3 text-cyan-400" /> View Slip
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: 1-CLICK PAY SALARY WITH DYNAMIC UPI QR ── */}
      <AnimatePresence>
        {payingStaff && (() => {
          const staff = payingStaff;
          const devUpiId = staff.payoutDetails?.upiId || "";
          const devName = staff.payoutDetails?.upiName || staff.name;
          const totalPay = staff.totalAccruedDue;

          const upiUri = devUpiId
            ? `upi://pay?pa=${encodeURIComponent(devUpiId)}&pn=${encodeURIComponent(devName)}&am=${totalPay}&tn=${encodeURIComponent(`Salary_${payPeriodInput.replace(/\s+/g, "_")}`)}`
            : "";
          const qrCodeUrl = devUpiId
            ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`
            : "";

          return (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
                onClick={() => setPayingStaff(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-[#111] border border-white/15 rounded-xl w-full max-w-xl p-6 sm:p-8 relative shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-sm">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Disburse Salary: {staff.name}</h3>
                        <p className="text-xs text-zinc-400">
                          {staff.designation} · Pay Period: {payPeriodInput}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPayingStaff(null)}
                      className="text-zinc-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* QR and Account Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                    {/* Left: Dynamic QR Code */}
                    <div className="bg-black/60 border border-white/10 p-4 rounded-2xl text-center space-y-2">
                      {devUpiId ? (
                        <>
                          <div className="bg-white p-2.5 rounded-xl inline-block shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={qrCodeUrl}
                              alt="Scan UPI QR"
                              className="w-36 h-36 mx-auto"
                            />
                          </div>
                          <p className="text-[11px] text-zinc-300 font-mono truncate">{devUpiId}</p>
                          <span className="text-[10px] text-zinc-500 block">
                            Scan with PhonePe, Google Pay, or Paytm
                          </span>
                        </>
                      ) : (
                        <div className="py-6 px-4 text-center text-xs text-amber-400 space-y-2">
                          <Building2 className="w-8 h-8 mx-auto text-amber-400/80" />
                          <p className="font-semibold">Direct Bank NEFT / IMPS</p>
                          {staff.payoutDetails?.accountNumber ? (
                            <div className="text-[11px] text-zinc-300 font-mono text-left bg-white/5 p-2 rounded-lg space-y-1">
                              <p>Bank: {staff.payoutDetails.bankName}</p>
                              <p>A/C: {staff.payoutDetails.accountNumber}</p>
                              <p>IFSC: {staff.payoutDetails.ifscCode}</p>
                              <p>Name: {staff.payoutDetails.accountHolderName}</p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-zinc-400">
                              Staff has not added UPI or Bank details. Ask staff to fill Settings &gt; Payout.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Accrued Items Summary */}
                    <div className="space-y-2.5 text-xs">
                      {staff.unpaidProjectEarnings > 0 && (
                        <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl flex justify-between">
                          <span className="text-zinc-400">Completed Sprints (40%):</span>
                          <span className="text-white font-mono font-bold">₹{staff.unpaidProjectEarnings.toLocaleString()}</span>
                        </div>
                      )}
                      {staff.unpaidRetainerEarnings > 0 && (
                        <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl flex justify-between">
                          <span className="text-zinc-400">Retainer Shares:</span>
                          <span className="text-white font-mono font-bold">₹{staff.unpaidRetainerEarnings.toLocaleString()}</span>
                        </div>
                      )}
                      {staff.fixedMonthlyDue > 0 && (
                        <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl flex justify-between">
                          <span className="text-zinc-400">Base Monthly Salary:</span>
                          <span className="text-white font-mono font-bold">₹{staff.fixedMonthlyDue.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-xl space-y-1">
                        <span className="text-[10px] text-cyan-400 uppercase font-bold">Total Net Payable</span>
                        <p className="text-2xl font-black text-cyan-300 font-mono">₹{totalPay.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Form for UTR / Txn Reference */}
                  <form onSubmit={handleConfirmDisbursement} className="space-y-4 text-xs pt-2 border-t border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-zinc-300 font-semibold mb-1 block">
                          Disbursement Channel <span className="text-cyan-400">*</span>
                        </label>
                        <select
                          value={disburseMethod}
                          onChange={(e) => setDisburseMethod(e.target.value as any)}
                          className="w-full bg-[#18181b] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="upi">Direct UPI Transfer</option>
                          <option value="bank_transfer">Bank NEFT / IMPS</option>
                          <option value="card">Company Card / Cash</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-zinc-300 font-semibold mb-1 block">
                          Transaction UTR / Ref Number <span className="text-cyan-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={disburseUtr}
                          onChange={(e) => setDisburseUtr(e.target.value)}
                          placeholder="e.g. 423589012345 / UPI txn id"
                          className="w-full bg-[#18181b] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-zinc-300 font-semibold mb-1 block">Pay Period Memo</label>
                        <input
                          type="text"
                          value={payPeriodInput}
                          onChange={(e) => setPayPeriodInput(e.target.value)}
                          className="w-full bg-[#18181b] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="text-zinc-300 font-semibold mb-1 block">Notes (Optional)</label>
                        <input
                          type="text"
                          value={disburseNotes}
                          onChange={(e) => setDisburseNotes(e.target.value)}
                          placeholder="e.g. Sprint bonus included"
                          className="w-full bg-[#18181b] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                      <Button
                        type="button"
                        onClick={() => setPayingStaff(null)}
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
                        disabled={isDisbursing}
                        className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold"
                      >
                        {isDisbursing ? "Disbursing..." : `Confirm ₹${totalPay.toLocaleString()} & Issue Slip`}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ── MODAL: OFFICIAL PRINTABLE SALARY PAY SLIP ── */}
      <AnimatePresence>
        {activeSlip && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md print:hidden"
              onClick={() => setActiveSlip(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-[#0e0e0e] border border-white/20 rounded-xl w-full max-w-2xl p-6 sm:p-10 relative shadow-2xl space-y-6 text-zinc-300 font-sans print:border-none print:shadow-none print:p-0">
                {/* Print & Close Controls */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 print:hidden">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Verified Salary Slip & Payment Voucher
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePrintSlip}
                      variant="accent"
                      size="sm"
                      className="rounded-xl text-xs flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                    </Button>
                    <button
                      onClick={() => setActiveSlip(null)}
                      className="text-zinc-500 hover:text-white cursor-pointer p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* ── FORMAL CORPORATE SALARY SLIP HEADER ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-white/10 pb-6">
                  <div>
                    <h1 className="text-xl font-black text-white tracking-tight ">RUNIX WEBTECH</h1>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Software Engineering & Digital Solutions</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Web: runix.in · contact@runix.in</p>
                  </div>
                  <div className="text-left sm:text-right font-mono">
                    <span className="text-xs font-black text-cyan-300 block">{activeSlip.id}</span>
                    <span className="text-[10px] text-zinc-400 block">Voucher: {activeSlip.voucherNumber}</span>
                    <span className="text-[10px] text-zinc-500 block">
                      Date: {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(activeSlip.disbursedAt))}
                    </span>
                  </div>
                </div>

                {/* Employee Information Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Employee Name</span>
                    <strong className="text-white font-sans">{activeSlip.staffName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Designation</span>
                    <span className="text-zinc-200">{activeSlip.designation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Pay Period</span>
                    <span className="text-cyan-300 font-bold">{activeSlip.payPeriod}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block">Disbursement Channel</span>
                    <span className="text-zinc-200 uppercase">{activeSlip.paymentMethod}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-zinc-500 uppercase block">Transaction Reference / UTR</span>
                    <span className="text-emerald-400 font-bold">{activeSlip.utrNumber}</span>
                  </div>
                </div>

                {/* Earnings & Net Amount */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="border-b border-white/10 pb-2 flex justify-between font-bold text-zinc-400 uppercase text-[10px]">
                    <span>Description / Compensation Component</span>
                    <span>Amount (INR)</span>
                  </div>

                  <div className="flex justify-between py-1.5 text-zinc-200">
                    <span>• Sprint Project 40% Share / Monthly Salary Disbursement</span>
                    <span>₹{activeSlip.amount.toLocaleString()}</span>
                  </div>

                  <div className="pt-4 border-t-2 border-white/20 flex justify-between items-center text-sm font-black text-white">
                    <span className="font-sans">TOTAL NET SALARY DISBURSED:</span>
                    <span className="text-emerald-400 font-mono text-lg">₹{activeSlip.amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Digital Seal & Sign */}
                <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Digitally Signed & Audited
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-300 font-bold font-sans">Runix Webtech Payroll Dept.</p>
                    <p className="text-[10px] text-zinc-600">Authorized Officer: {activeSlip.disbursedByName}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MODAL: CONFIGURE STAFF SALARY STRUCTURE ── */}
      <AnimatePresence>
        {editingStaffConfig && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              onClick={() => setEditingStaffConfig(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#111] border border-white/15 rounded-xl w-full max-w-md p-6 sm:p-8 relative shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                      <Settings2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Configure Compensation</h3>
                      <p className="text-xs text-zinc-400">{editingStaffConfig.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingStaffConfig(null)}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveSalaryConfig} className="space-y-4 text-xs">
                  <div>
                    <label className="text-zinc-300 font-semibold mb-1 block">Compensation Model</label>
                    <select
                      value={configType}
                      onChange={(e) => setConfigType(e.target.value as any)}
                      className="w-full bg-[#18181b] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="percentage">Project Revenue Share (%) — Default 40%</option>
                      <option value="fixed_monthly">Fixed Monthly Salary (₹ / month)</option>
                      <option value="hybrid">Hybrid (Fixed Base + % Share)</option>
                    </select>
                  </div>

                  {(configType === "percentage" || configType === "hybrid") && (
                    <div>
                      <label className="text-zinc-300 font-semibold mb-1 block">
                        Project Revenue Share Rate (%) <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={configPercentage}
                        onChange={(e) => setConfigPercentage(e.target.value)}
                        className="w-full bg-[#18181b] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">Default is 40% of total client project price.</p>
                    </div>
                  )}

                  {(configType === "fixed_monthly" || configType === "hybrid") && (
                    <div>
                      <label className="text-zinc-300 font-semibold mb-1 block">
                        Fixed Monthly Base Salary (₹ INR) <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={configFixedAmount}
                        onChange={(e) => setConfigFixedAmount(e.target.value)}
                        className="w-full bg-[#18181b] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-zinc-300 font-semibold mb-1 block">Role / Designation Title</label>
                    <input
                      type="text"
                      value={configDesignation}
                      onChange={(e) => setConfigDesignation(e.target.value)}
                      placeholder="e.g. Senior Full-Stack Architect"
                      className="w-full bg-[#18181b] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <Button
                      type="button"
                      onClick={() => setEditingStaffConfig(null)}
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
                      disabled={savingConfig}
                      className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                    >
                      {savingConfig ? "Saving..." : "Save Compensation Rules"}
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
