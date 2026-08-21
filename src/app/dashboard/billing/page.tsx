"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { CreditCard, Download, Receipt, CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Order {
  id: string;
  planName: string;
  totalPrice?: number;
  price?: number;
  advancePrice?: number;
  advancePaid?: boolean;
  advancePaymentId?: string;
  finalPrice?: number;
  finalPaid?: boolean;
  finalPaymentId?: string;
  currency: string;
  status: string;
  createdAt: any;
}

export default function BillingPage() {
  const { user, isDeveloper } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDeveloper) {
      router.replace("/dashboard/developer");
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
        setLoading(false);
      },
      (err) => {
        console.warn("Realtime billing listener notice:", err?.message || err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const totalPaid = orders.reduce((acc, o) => {
    let sum = 0;
    const total = o.totalPrice || o.price || 0;
    const advance = o.advancePrice || Math.round(total * 0.5);
    const final = o.finalPrice || (total - advance);

    if (o.advancePaid || o.status === "in_progress" || o.status === "awaiting_final_payment" || o.status === "completed") {
      sum += advance;
    }
    if (o.finalPaid || o.status === "completed") {
      sum += final;
    }
    return acc + sum;
  }, 0);

  const pendingMilestonesCount = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-jakarta tracking-tight">Milestone Invoices & Billing</h1>
          <p className="text-zinc-500 text-sm mt-1">Review your 50% advance and 50% final milestone payment statements.</p>
        </div>
        <Link href="/pricing">
          <Button variant="accent" size="sm" className="rounded-xl text-xs font-bold">
            + Book New Project
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">₹{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-zinc-500">Total Settled</p>
          </div>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{orders.length}</p>
            <p className="text-xs text-zinc-500">Total Projects</p>
          </div>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{pendingMilestonesCount}</p>
            <p className="text-xs text-zinc-500">Active Sprints</p>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-bold text-white">50/50 Milestone Breakdown</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-[3px] border-white/10 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium text-sm">No billing statements found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-3 font-semibold">Project</th>
                  <th className="px-6 py-3 font-semibold">Total Fee</th>
                  <th className="px-6 py-3 font-semibold">50% Advance</th>
                  <th className="px-6 py-3 font-semibold">50% Handover</th>
                  <th className="px-6 py-3 font-semibold">Overall Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => {
                  const total = order.totalPrice || order.price || 0;
                  const advance = order.advancePrice || Math.round(total * 0.5);
                  const final = order.finalPrice || (total - advance);
                  const isAdvancePaid = order.advancePaid || order.status === "in_progress" || order.status === "awaiting_final_payment" || order.status === "completed";
                  const isFinalPaid = order.finalPaid || order.status === "completed";

                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white block">{order.planName}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">ID: {order.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">₹{total.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <span className="font-semibold text-white">₹{advance.toLocaleString()}</span>
                          <span className={`block text-[10px] font-bold ${isAdvancePaid ? "text-emerald-400" : "text-amber-400"}`}>
                            {isAdvancePaid ? "✓ Paid" : "• Due"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <span className="font-semibold text-white">₹{final.toLocaleString()}</span>
                          <span className={`block text-[10px] font-bold ${isFinalPaid ? "text-emerald-400" : "text-zinc-500"}`}>
                            {isFinalPaid ? "✓ Settled" : "• Due at Handover"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            order.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : order.status === "awaiting_final_payment"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : order.status === "in_progress"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
