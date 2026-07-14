"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { FolderKanban, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  planName: string;
  price: number;
  currency: string;
  status: string;
  createdAt: any;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "Pending Payment", color: "text-amber-400 bg-amber-500/10", icon: Clock },
  in_progress: { label: "In Progress", color: "text-blue-400 bg-blue-500/10", icon: FolderKanban },
  completed: { label: "Completed", color: "text-emerald-400 bg-emerald-500/10", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-500/10", icon: AlertCircle },
};

export default function ProjectsPage() {
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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white font-jakarta tracking-tight">My Projects</h1>
        <p className="text-zinc-500 text-sm mt-1">Track the progress of all your active and past projects.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-white/10 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111] border border-white/5 rounded-2xl p-16 text-center">
          <FolderKanban className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-300 mb-1">No projects yet</h3>
          <p className="text-zinc-600 text-sm">When you purchase a plan, your projects will appear here.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const config = statusConfig[order.status] || statusConfig.pending_payment;
            const StatusIcon = config.icon;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{order.planName} Plan</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {order.createdAt?.toDate?.()
                          ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(order.createdAt.toDate())
                          : "Date unavailable"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-white">{order.currency}{order.price?.toLocaleString()}</span>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${config.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
