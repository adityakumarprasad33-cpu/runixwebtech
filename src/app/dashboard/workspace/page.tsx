"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import DeveloperInteractionRoom from "@/components/dashboard/DeveloperInteractionRoom";
import {
  MessageSquare,
  FolderKanban,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Order {
  id: string;
  planName: string;
  status: string;
  price?: number;
  currency?: string;
  userEmail?: string;
  userId?: string;
  createdAt?: any;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  awaiting_verification: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pending_payment: "bg-red-500/10 text-red-400 border-red-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const LOCKED_STATUSES = ["pending_payment", "awaiting_verification", "pending", "rejected"];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

export default function WorkspacePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetchOrders();
    }
  }, [user, loading]);

  const fetchOrders = async () => {
    if (!user) return;
    setFetchingOrders(true);
    try {
      let snap;
      if (profile?.role === "admin") {
        // Admin sees all orders
        snap = await getDocs(collection(db, "orders"));
      } else {
        // User sees only their own orders
        snap = await getDocs(
          query(collection(db, "orders"), where("userId", "==", user.uid))
        );
      }
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      // Sort: active (in_progress/completed) first, then others
      data.sort((a, b) => {
        const priority = (s: string) =>
          s === "in_progress" ? 0 : s === "completed" ? 1 : s === "awaiting_verification" ? 2 : 3;
        return priority(a.status) - priority(b.status);
      });
      setOrders(data);
      // Auto-open first unlocked order
      const firstActive = data.find((o) => !LOCKED_STATUSES.includes(o.status));
      if (firstActive) setOpenOrderId(firstActive.id);
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setFetchingOrders(false);
    }
  };

  if (loading || fetchingOrders) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeUp} className="flex items-center gap-4">
        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-jakarta font-bold text-white">Developer Workspace</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Direct communication with the dev team — share files, links, and project updates.
          </p>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        {...fadeUp}
        className="flex flex-wrap items-center gap-3 text-[11px] px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5"
      >
        <span className="text-zinc-500 font-medium">Room Status:</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Unlocked (Active Project)
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <Lock className="w-3 h-3" /> Locked (Awaiting Payment Verification)
        </span>
      </motion.div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <motion.div
          {...fadeUp}
          className="text-center py-20 text-zinc-500 border border-white/5 rounded-2xl bg-white/[0.02]"
        >
          <FolderKanban className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm font-medium">No projects found</p>
          <p className="text-xs mt-1">Submit a project inquiry from your dashboard to get started.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const isLocked = LOCKED_STATUSES.includes(order.status);
            const isOpen = openOrderId === order.id;
            const statusColor = STATUS_COLORS[order.status] || STATUS_COLORS.pending_payment;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`rounded-2xl border transition-all duration-200 ${
                  isOpen
                    ? "border-indigo-500/30 bg-[#0e0e0e]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {/* Order Header — click to expand/collapse */}
                <button
                  onClick={() => setOpenOrderId(isOpen ? null : order.id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isLocked
                          ? "bg-zinc-800 text-zinc-500"
                          : "bg-indigo-500/10 text-indigo-400"
                      }`}
                    >
                      {isLocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{order.planName}</p>
                        {profile?.role === "admin" && order.userEmail && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            — {order.userEmail}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}
                        >
                          {order.status?.replace(/_/g, " ")}
                        </span>
                        {order.price && (
                          <span className="text-xs text-zinc-500">
                            {order.currency || "₹"}{order.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-500">
                    {!isLocked && (
                      <span className="text-[10px] font-medium text-indigo-400">
                        {isOpen ? "Close" : "Open"} Room
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Developer Interaction Room — expanded */}
                {isOpen && (
                  <div className="px-5 pb-5">
                    <DeveloperInteractionRoom
                      orderId={order.id}
                      orderStatus={order.status}
                      planName={order.planName}
                      currentUserId={user?.uid || ""}
                      currentUserName={
                        user?.displayName ||
                        profile?.name ||
                        (profile?.role === "admin" ? "Admin" : "Client")
                      }
                      currentUserRole={profile?.role === "admin" ? "admin" : "user"}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
