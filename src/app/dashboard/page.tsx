"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, collection, getDocs, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  FolderKanban,
  CreditCard,
  Clock,
  TrendingUp,
  ShoppingCart,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
}

interface Order {
  id: string;
  planName: string;
  price: number;
  currency: string;
  status: string;
  createdAt: any;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartItem, setCartItem] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch profile
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile({
          name: user.displayName || "User",
          email: user.email || "",
          phone: "N/A",
          location: "N/A",
        });
      }

      // Fetch orders
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };

    fetchData();

    // Check pending cart
    const pending = localStorage.getItem("pending_cart");
    if (pending) setCartItem(JSON.parse(pending));
  }, [user]);

  const handleCheckout = async () => {
    if (!user || !cartItem) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userEmail: user.email,
        planId: cartItem.id,
        planName: cartItem.name,
        price: cartItem.price,
        currency: cartItem.currency,
        status: "pending_payment",
        createdAt: serverTimestamp(),
      });
      localStorage.removeItem("pending_cart");
      setCartItem(null);
      setPurchaseSuccess(true);
    } catch (err) {
      console.error("Failed to process order", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const firstName = profile?.name?.split(" ")[0] || user?.displayName?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Welcome Banner ── */}
      <motion.div {...fadeUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-[#111] to-purple-600/10 border border-white/5 p-8 sm:p-10">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Dashboard
          </div>
          <h1 className="font-jakarta text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
            {greeting}, {firstName}
          </h1>
          <p className="text-zinc-400 text-base max-w-lg">
            Here's an overview of your account, active projects, and recent activity.
          </p>
        </div>
      </motion.div>

      {/* ── Pending Cart Banner ── */}
      {cartItem && (
        <motion.div {...fadeUp} className="rounded-2xl bg-gradient-to-r from-indigo-900/30 to-indigo-900/10 border border-indigo-500/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Pending Purchase</h3>
              <p className="text-zinc-400 text-sm">
                You selected the <span className="text-white font-semibold">{cartItem.name}</span> plan —{" "}
                <span className="text-white font-bold">{cartItem.currency}{cartItem.price}</span>
              </p>
            </div>
            <Button
              onClick={handleCheckout}
              variant="accent"
              className="rounded-xl h-11 px-6 text-sm shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm & Pay"}
            </Button>
          </div>
        </motion.div>
      )}

      {purchaseSuccess && (
        <motion.div {...fadeUp} className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-1">Request Received!</h3>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">Our team will contact you shortly to begin the onboarding process.</p>
        </motion.div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: orders.filter((o) => o.status !== "completed").length.toString(), icon: FolderKanban, color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Total Spent", value: `${orders.length > 0 ? orders[0]?.currency || "₹" : "₹"}${orders.reduce((a, o) => a + (o.price || 0), 0).toLocaleString()}`, icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Pending", value: orders.filter((o) => o.status === "pending_payment").length.toString(), icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Completed", value: orders.filter((o) => o.status === "completed").length.toString(), icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors"
          >
            <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
              <p className="text-xs text-zinc-500 font-medium">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div {...fadeUp} className="lg:col-span-2 bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-base font-bold text-white">Recent Orders</h2>
            {orders.length > 0 && (
              <button
                onClick={() => router.push("/dashboard/billing")}
                className="text-xs text-zinc-500 hover:text-white font-medium transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="divide-y divide-white/5">
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <FolderKanban className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium text-sm mb-1">No orders yet</p>
                <p className="text-zinc-600 text-xs">Your project orders will appear here.</p>
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <FolderKanban className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{order.planName} Plan</p>
                      <p className="text-xs text-zinc-500">
                        {order.createdAt?.toDate?.()
                          ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(order.createdAt.toDate())
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-white">
                      {order.currency}{order.price?.toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        order.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : order.status === "pending_payment"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...fadeUp} className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-5">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/services#pricing")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Browse Plans</p>
                <p className="text-xs text-zinc-500">View pricing & packages</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => router.push("/contact")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Start a Project</p>
                <p className="text-xs text-zinc-500">Describe your requirements</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => router.push("/work")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">View Portfolio</p>
                <p className="text-xs text-zinc-500">See our live projects</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Account info mini */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <h3 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">Account</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Name</span>
                <span className="text-white font-medium truncate ml-4">{profile?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Phone</span>
                <span className="text-white font-medium">{profile?.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Location</span>
                <span className="text-white font-medium truncate ml-4">{profile?.location || "—"}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
