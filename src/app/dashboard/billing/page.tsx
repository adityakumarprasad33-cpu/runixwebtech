"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { CreditCard, Receipt, Zap } from "lucide-react";
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
  }, [user, isDeveloper, router]);

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
          <h1 className="text-2xl font-bold text-[#111317]  tracking-tight">Milestone Invoices & Billing</h1>
          <p className="text-[#4B5563] text-sm mt-1">Review your 50% advance and 50% final milestone payment statements.</p>
        </div>
        <Link href="/pricing">
          <Button variant="accent" size="sm" className="rounded-xl text-xs font-bold shadow-sm">
            + Book New Project
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[rgba(21,24,29,0.10)] rounded-2xl p-5 flex items-center gap-4 shadow-[0_12px_40px_rgba(21,24,29,0.04)]">
          <div className="w-11 h-11 rounded-xl bg-[#169B62]/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#169B62]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#111317]">₹{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-[#6B7280]">Total Settled</p>
          </div>
        </div>
        <div className="bg-white border border-[rgba(21,24,29,0.10)] rounded-2xl p-5 flex items-center gap-4 shadow-[0_12px_40px_rgba(21,24,29,0.04)]">
          <div className="w-11 h-11 rounded-xl bg-[#315EF7]/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-[#315EF7]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#111317]">{orders.length}</p>
            <p className="text-xs text-[#6B7280]">Total Projects</p>
          </div>
        </div>
        <div className="bg-white border border-[rgba(21,24,29,0.10)] rounded-2xl p-5 flex items-center gap-4 shadow-[0_12px_40px_rgba(21,24,29,0.04)]">
          <div className="w-11 h-11 rounded-xl bg-[#B77900]/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#B77900]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#111317]">{pendingMilestonesCount}</p>
            <p className="text-xs text-[#6B7280]">Active Sprints</p>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-[rgba(21,24,29,0.10)] rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(21,24,29,0.06)]">
        <div className="p-6 border-b border-[rgba(21,24,29,0.08)] bg-[#FAFAFA]">
          <h2 className="text-base font-bold text-[#111317]">50/50 Milestone Breakdown</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-[3px] border-[rgba(21,24,29,0.10)] border-t-[#315EF7] rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-[#6B7280] mx-auto mb-4" />
            <p className="text-[#4B5563] font-medium text-sm">No billing statements found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#6B7280] uppercase tracking-wider border-b border-[rgba(21,24,29,0.08)] bg-[#FAFAFA]">
                  <th className="px-6 py-3 font-semibold">Project</th>
                  <th className="px-6 py-3 font-semibold">Total Fee</th>
                  <th className="px-6 py-3 font-semibold">50% Advance</th>
                  <th className="px-6 py-3 font-semibold">50% Handover</th>
                  <th className="px-6 py-3 font-semibold">Overall Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(21,24,29,0.06)]">
                {orders.map((order) => {
                  const total = order.totalPrice || order.price || 0;
                  const advance = order.advancePrice || Math.round(total * 0.5);
                  const final = order.finalPrice || (total - advance);
                  const isAdvancePaid = order.advancePaid || order.status === "in_progress" || order.status === "awaiting_final_payment" || order.status === "completed";
                  const isFinalPaid = order.finalPaid || order.status === "completed";

                  return (
                    <tr key={order.id} className="hover:bg-[#F1F2F4]/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#111317] block">{order.planName}</span>
                        <span className="text-[10px] text-[#6B7280] font-mono">ID: {order.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#111317]">₹{total.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <span className="font-semibold text-[#111317]">₹{advance.toLocaleString()}</span>
                          <span className={`block text-[10px] font-bold ${isAdvancePaid ? "text-[#169B62]" : "text-[#B77900]"}`}>
                            {isAdvancePaid ? "✓ Paid" : "• Due"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <span className="font-semibold text-[#111317]">₹{final.toLocaleString()}</span>
                          <span className={`block text-[10px] font-bold ${isFinalPaid ? "text-[#169B62]" : "text-[#6B7280]"}`}>
                            {isFinalPaid ? "✓ Settled" : "• Due at Handover"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            order.status === "completed"
                              ? "bg-[#169B62]/10 text-[#169B62] border border-[#169B62]/20"
                              : order.status === "awaiting_final_payment"
                              ? "bg-[#B77900]/10 text-[#B77900] border border-[#B77900]/20"
                              : order.status === "in_progress"
                              ? "bg-[#315EF7]/10 text-[#315EF7] border border-[#315EF7]/20"
                              : "bg-[#FAFAFA] text-[#4B5563] border border-[rgba(21,24,29,0.12)]"
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
