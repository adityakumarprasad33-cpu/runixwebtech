"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { CreditCard, Download, Receipt } from "lucide-react";

interface Order {
  id: string;
  planName: string;
  price: number;
  currency: string;
  status: string;
  createdAt: any;
}

export default function BillingPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const totalSpent = orders.reduce((acc, o) => acc + (o.price || 0), 0);
  const currency = orders.length > 0 ? orders[0].currency : "₹";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white font-jakarta tracking-tight">Billing</h1>
        <p className="text-zinc-500 text-sm mt-1">View your payment history and invoices.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{currency}{totalSpent.toLocaleString()}</p>
            <p className="text-xs text-zinc-500">Total Spent</p>
          </div>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{orders.length}</p>
            <p className="text-xs text-zinc-500">Total Invoices</p>
          </div>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{orders.filter(o => o.status === "pending_payment").length}</p>
            <p className="text-xs text-zinc-500">Pending Payments</p>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-bold text-white">Payment History</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-[3px] border-white/10 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium text-sm">No payment history</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-3 font-semibold">Plan</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{order.planName}</td>
                    <td className="px-6 py-4 text-zinc-400">
                      {order.createdAt?.toDate?.()
                        ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(order.createdAt.toDate())
                        : "—"}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{order.currency}{order.price?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        order.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
