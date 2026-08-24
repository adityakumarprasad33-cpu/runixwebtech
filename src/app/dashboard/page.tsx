"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  CreditCard,
  Clock,
  ArrowRight,
  LayoutDashboard,
  ExternalLink,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
  Zap,
  Globe,
  Download,
  Code,
  AlertCircle,
  HelpCircle,
  Wrench,
  X,
  Copy,
  Check,
  IndianRupee,
  QrCode,
} from "lucide-react";
import DeveloperInteractionRoom from "@/components/dashboard/DeveloperInteractionRoom";
import Link from "next/link";
import { safeFetchJson, normalizeUrl } from "@/lib/safeFetch";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  designation?: string;
  department?: string;
  role?: string;
}

interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  planName: string;
  price?: number;
  totalPrice?: number;
  advancePrice?: number;
  advancePaid?: boolean;
  advancePaymentId?: string;
  advanceUtr?: string;
  finalPrice?: number;
  finalPaid?: boolean;
  finalPaymentId?: string;
  finalUtr?: string;
  currency?: string;
  status: string;
  createdAt: any;
  utrNumber?: string;
  assignedDeveloperId?: string;
  assignedDeveloperName?: string;
  assignedDeveloperEmail?: string;
  assignedAt?: string;
  assignmentMode?: string;
  maintenanceActive?: boolean;
  maintenancePaid?: boolean;
  maintenancePaidAt?: string;
  maintenanceExpiresAt?: string;
  maintenanceAssignedDevId?: string;
  maintenanceAssignedDevName?: string;
  maintenanceAssignedDevEmail?: string;
  maintenanceAssignmentMode?: string;
  maintenanceAmount?: number;
  formData?: {
    name?: string;
    email?: string;
    company?: string;
    projectType?: string;
    timeline?: string;
    details?: string;
    addons?: string[];
  };
  stagingUrl?: string;
  demoUrl?: string;
  handoverLinks?: {
    githubRepo?: string;
    liveUrl?: string;
    driveZip?: string;
  };
  handoverNotes?: string;
  adminQuery?: string;
  userResponse?: string;
  hasPendingQuery?: boolean;
  statusCaption?: string;
  finalUtrNumber?: string;
  maintenanceUtr?: string;
}

const fadeUp: any = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

// Content-aware order deduplication: collapse rage-click duplicates
// (same plan + status created within 10 minutes) into a single entry.
const dedupeOrders = (orders: any[]): any[] => {
  if (!orders || orders.length === 0) return [];
  const idSeen = new Set<string>();
  const unique = orders.filter((o) => {
    if (!o?.id) return true;
    if (idSeen.has(o.id)) return false;
    idSeen.add(o.id);
    return true;
  });
  const sorted = [...unique].sort((a, b) => {
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
  const kept: any[] = [];
  const seen = new Map<string, number>();
  for (const o of sorted) {
    const fp = `${o.userId || ""}|${o.planId || o.planName || ""}|${o.status || ""}`;
    const ts = new Date(o.createdAt || 0).getTime();
    const prev = seen.get(fp);
    if (prev && Math.abs(ts - prev) < 10 * 60 * 1000) continue;
    seen.set(fp, ts);
    kept.push(o);
  }
  return kept;
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Query Response State
  const [respondingOrderId, setRespondingOrderId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Developer Room toggle
  const [openRoomOrderId, setOpenRoomOrderId] = useState<string | null>(null);

  // Milestone Payment Modal state
  const [payingMilestoneOrder, setPayingMilestoneOrder] = useState<{
    order: Order;
    milestone: "advance" | "final" | "maintenance";
    amount: number;
    title: string;
  } | null>(null);
  const [utrInput, setUtrInput] = useState("");
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [paymentTab, setPaymentTab] = useState<"upi" | "gateway">("upi");
  const [initiatingPaytm, setInitiatingPaytm] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<{
    upiId: string;
    upiName: string;
    upiNumber?: string;
    qrCodeUrl?: string;
    paymentMode?: string;
  }>({
    upiId: "adityakumarprasad33-1@okaxis",
    upiName: "RUNIX WEBTECH",
    upiNumber: "8058204689",
    paymentMode: "manual",
  });

  useEffect(() => {
    // Real-time payment settings listener
    const unsubSettings = onSnapshot(
      doc(db, "settings", "payment"),
      (snap) => {
        if (snap.exists()) {
          setPaymentSettings((prev) => ({ ...prev, ...(snap.data() as any) }));
        }
      },
      (err) => console.warn("Payment settings listener notice:", err?.message || err)
    );
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (!user) return;

    // 1. Real-time User Profile Listener
    const unsubProfile = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          if (profileData.role === "developer") {
            router.replace("/dashboard/developer");
            return;
          }
          setProfile(profileData);
        } else {
          setProfile({
            name: user.displayName || "Client",
            email: user.email || "",
            phone: "N/A",
            location: "N/A",
          });
        }
      },
      (err) => console.warn("Dashboard profile listener notice:", err?.message || err)
    );

    // 2. Real-time User Orders Listener
    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        setOrders(dedupeOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))));
        setLoadingOrders(false);
      },
      (err) => {
        console.warn("Dashboard orders listener notice:", err?.message || err);
        setLoadingOrders(false);
      }
    );

    return () => {
      unsubProfile();
      unsubOrders();
    };
  }, [user]);

  const handleRespondToQuery = async (orderId: string) => {
    if (!responseText.trim()) return;
    setSubmittingResponse(true);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        userResponse: responseText.trim(),
        hasPendingQuery: false,
        responseCreatedAt: new Date().toISOString(),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, userResponse: responseText.trim(), hasPendingQuery: false }
            : o
        )
      );
      setRespondingOrderId(null);
      setResponseText("");
      alert("Response submitted to admin!");
    } catch (err) {
      console.error("Failed to submit response:", err);
      alert("Failed to submit response. Please try again.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrInput.trim()) {
      alert("Please enter the 12-digit UTR / UPI Reference ID from your payment app");
      return;
    }
    if (!payingMilestoneOrder) return;
    setSubmittingUtr(true);
    try {
      const res = await safeFetchJson<any>("/api/orders/submit-utr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: payingMilestoneOrder.order.id,
          utrNumber: utrInput.trim(),
          milestone: payingMilestoneOrder.milestone,
        }),
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || "Failed to submit UTR reference");
      }

      alert(
        `UTR reference (${utrInput.trim()}) submitted successfully for ${payingMilestoneOrder.title}! Our team is verifying with the bank.`
      );
      setPayingMilestoneOrder(null);
      setUtrInput("");
    } catch (e: any) {
      console.error("UTR submission error:", e);
      alert(e.message || "Failed to submit UTR reference. Please try again.");
    } finally {
      setSubmittingUtr(false);
    }
  };

  const handlePaytmCheckout = async (
    order: Order,
    milestone: "advance" | "final" | "maintenance" = "advance",
    amountOverride?: number,
    allowSimulation: boolean = false
  ) => {
    setInitiatingPaytm(true);
    try {
      const amount = amountOverride || (milestone === "advance" ? order.advancePrice : order.finalPrice) || 0;
      const res = await safeFetchJson<any>("/api/payments/paytm/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount,
          milestone,
          userEmail: user?.email || order.userEmail,
          userName: user?.displayName || profile?.name || "Client",
        }),
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(
          res.error ||
            "Online Payment Gateway is currently under setup. Please use the Direct UPI / QR Code option to complete your payment."
        );
      }

      const data = res.data;
      if (data.txnToken && data.callbackUrl) {
        window.location.href = `${data.callbackUrl}&txnToken=${data.txnToken}`;
      } else {
        throw new Error("Online Payment Gateway is not configured. Please pay via Direct UPI / QR Code and submit your 12-digit UTR.");
      }
    } catch (e: any) {
      console.error("Paytm checkout notice:", e);
      alert(e.message || "Online Payment Gateway is currently unavailable. Please use Direct UPI / QR Code.");
      setPaymentTab("upi");
    } finally {
      setInitiatingPaytm(false);
    }
  };

  const firstName =
    profile?.name?.split(" ")[0] ||
    user?.displayName?.split(" ")[0] ||
    "Client";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeProjectsCount = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled").length;
  const completedProjectsCount = orders.filter((o) => o.status === "completed").length;
  const totalSpent = orders.reduce((acc, o) => {
    let sum = 0;
    if (o.advancePaid) sum += o.advancePrice || (o.totalPrice ? Math.round(o.totalPrice * 0.5) : 0);
    if (o.finalPaid) sum += o.finalPrice || (o.totalPrice ? Math.round(o.totalPrice * 0.5) : 0);
    return acc + sum;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ── Welcome Banner with New Project CTA ── */}
      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black border border-white/10 p-8 sm:p-10 shadow-2xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Client Workspace
            </div>
            <h1 className="font-jakarta text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
              {greeting}, {firstName}
            </h1>
            <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
              Track your active sprints, review live staging builds, collaborate in real-time with your lead developer, and manage milestone settlements.
            </p>
          </div>

          <Link href="/pricing" className="shrink-0">
            <Button
              variant="accent"
              className="rounded-2xl h-12 px-6 text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Book New Project <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Active Sprints</span>
            <span className="text-2xl font-black text-white">{activeProjectsCount}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Completed Builds</span>
            <span className="text-2xl font-black text-white">{completedProjectsCount}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Total Milestone Paid</span>
            <span className="text-2xl font-black text-white">₹{totalSpent.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Active Projects & Milestone Trackers ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-jakarta tracking-tight">Your Projects & Sprints</h2>
          <span className="text-xs text-zinc-500 font-mono">{orders.length} Total</span>
        </div>

        {loadingOrders ? (
          <div className="text-center py-16 text-zinc-500 text-sm">Loading project workspaces...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 rounded-3xl bg-zinc-950/40 border border-white/5 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Active Projects Yet</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                Explore our transparent 50/50 milestone packages and launch your next high-converting website today.
              </p>
            </div>
            <Link href="/pricing" className="inline-block pt-2">
              <Button variant="accent" size="sm" className="rounded-xl">
                Explore Pricing & Packages <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isAdvancePaid = order.advancePaid || order.status === "in_progress" || order.status === "awaiting_final_payment" || order.status === "completed";
              const isStagingReady = !!order.stagingUrl || order.status === "awaiting_final_payment" || order.status === "completed";
              const isFinalPaid = order.finalPaid || order.status === "completed";
              const isCompleted = order.status === "completed";

              const advanceAmount = order.advancePrice || (order.totalPrice ? Math.round(order.totalPrice * 0.5) : 0);
              const finalAmount = order.finalPrice || (order.totalPrice ? order.totalPrice - advanceAmount : 0);

              return (
                <div
                  key={order.id}
                  className="rounded-3xl bg-[#0e0e0e] border border-white/10 p-6 sm:p-8 space-y-6 hover:border-white/20 transition-all shadow-xl"
                >
                  {/* Project Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">{order.planName}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : order.status === "awaiting_final_payment"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : order.status === "in_progress"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {isCompleted
                            ? "Completed & Handed Over"
                            : order.status === "awaiting_final_payment"
                            ? "Staging Ready • Final Settlement Due"
                            : order.status === "in_progress"
                            ? "Active Sprint in Progress"
                            : "Awaiting 50% Advance"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {order.formData?.company ? `${order.formData.company} • ` : ""}
                        Timeline: {order.formData?.timeline || "Standard"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setOpenRoomOrderId(openRoomOrderId === order.id ? null : order.id)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        {openRoomOrderId === order.id ? "Close Chat" : "Developer Chat"}
                      </Button>
                    </div>
                  </div>

                  {/* 50/50 Milestone Tracker Visualizer */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">
                      50 / 50 Milestone Roadmap:
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Milestone 1 */}
                      <div
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${
                          isAdvancePaid
                            ? "bg-emerald-950/20 border-emerald-500/30"
                            : "bg-indigo-950/20 border-indigo-500/40"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">1. 50% Advance</span>
                          {isAdvancePaid ? (
                            <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                            </span>
                          ) : (
                            <span className="text-indigo-400 font-bold">Due</span>
                          )}
                        </div>
                        <div className="text-base font-black text-white">₹{advanceAmount.toLocaleString()}</div>
                        {!isAdvancePaid && (
                          <Button
                            onClick={() =>
                              setPayingMilestoneOrder({
                                order,
                                milestone: "advance",
                                amount: advanceAmount,
                                title: "50% Advance Booking Deposit",
                              })
                            }
                            variant="accent"
                            size="sm"
                            className="rounded-xl text-xs w-full mt-2 h-8"
                          >
                            Pay ₹{advanceAmount.toLocaleString()} Advance
                          </Button>
                        )}
                      </div>

                      {/* Milestone 2 */}
                      <div
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${
                          isAdvancePaid && !isCompleted
                            ? "bg-blue-950/20 border-blue-500/30"
                            : isCompleted
                            ? "bg-emerald-950/20 border-emerald-500/30"
                            : "bg-black/30 border-white/5 text-zinc-600"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold ${isAdvancePaid ? "text-white" : "text-zinc-600"}`}>
                            2. Active Sprint
                          </span>
                          {isAdvancePaid && (
                            <span className="text-blue-400 font-bold flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5" /> In Dev
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {isAdvancePaid ? "Code architecture & design active" : "Starts after advance"}
                        </div>
                      </div>

                      {/* Milestone 3 */}
                      <div
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${
                          isStagingReady
                            ? "bg-purple-950/20 border-purple-500/30"
                            : "bg-black/30 border-white/5 text-zinc-600"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold ${isStagingReady ? "text-white" : "text-zinc-600"}`}>
                            3. Live Staging Demo
                          </span>
                          {isStagingReady && (
                            <span className="text-purple-400 font-bold flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5" /> Ready
                            </span>
                          )}
                        </div>
                        {order.stagingUrl || order.demoUrl ? (
                          <div className="pt-1">
                            <Link
                              href={`/preview?url=${encodeURIComponent(normalizeUrl(order.stagingUrl || order.demoUrl || ""))}&title=${encodeURIComponent(order.planName || "Staging Preview")}&ref=/dashboard`}
                              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 hover:text-white border border-purple-500/40 flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-purple-500/10"
                            >
                              <Globe className="w-3.5 h-3.5" /> Preview Demo ↗
                            </Link>
                          </div>
                        ) : order.status === "awaiting_final_payment" || order.status === "completed" ? (
                          <div className="text-xs text-purple-300 font-medium">Staging deployment active</div>
                        ) : (
                          <div className="text-xs text-zinc-500">Staging URL deployed soon</div>
                        )}
                      </div>

                      {/* Milestone 4 */}
                      <div
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${
                          isFinalPaid
                            ? "bg-emerald-950/20 border-emerald-500/30"
                            : order.status === "awaiting_final_payment"
                            ? "bg-amber-950/20 border-amber-500/40"
                            : "bg-black/30 border-white/5 text-zinc-600"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold ${isStagingReady ? "text-white" : "text-zinc-600"}`}>
                            4. Final 50% & Handover
                          </span>
                          {isFinalPaid ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                            </span>
                          ) : (
                            <span className="text-zinc-500 font-bold">₹{finalAmount.toLocaleString()}</span>
                          )}
                        </div>
                        <div className="text-base font-black text-white">₹{finalAmount.toLocaleString()}</div>
                        {order.status === "awaiting_final_payment" && !isFinalPaid && (
                          <Button
                            onClick={() =>
                              setPayingMilestoneOrder({
                                order,
                                milestone: "final",
                                amount: finalAmount,
                                title: "Final 50% Milestone & Repository Handover",
                              })
                            }
                            variant="accent"
                            size="sm"
                            className="rounded-xl text-xs w-full mt-2 h-8 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                          >
                            Pay Final ₹{finalAmount.toLocaleString()}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Project Handover Assets (When completed) */}
                  {isCompleted && (
                    <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Final Handover Assets & Source Code Unlocked!
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        {order.handoverLinks?.liveUrl && (
                          <a
                            href={order.handoverLinks.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10"
                          >
                            <Globe className="w-3.5 h-3.5 text-indigo-400" /> Live Production URL
                          </a>
                        )}
                        {order.handoverLinks?.githubRepo && (
                          <a
                            href={order.handoverLinks.githubRepo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10"
                          >
                            <Code className="w-3.5 h-3.5 text-zinc-300" /> GitHub Repository
                          </a>
                        )}
                        {order.handoverLinks?.driveZip && (
                          <a
                            href={order.handoverLinks.driveZip}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" /> Download Build ZIP
                          </a>
                        )}
                      </div>
                      {order.handoverNotes && (
                        <p className="text-xs text-zinc-400 pt-1">{order.handoverNotes}</p>
                      )}
                    </div>
                  )}

                  {/* ── Ongoing Website Maintenance & Support Section ── */}
                  {isCompleted && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/20 via-indigo-950/20 to-black border border-purple-500/30 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              Website Maintenance & Dedicated Support
                              {order.maintenanceActive && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                                  ACTIVE COVERAGE
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-zinc-400">
                              {order.maintenanceActive
                                ? `Covered until ${new Date(order.maintenanceExpiresAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} • Engineer: ${order.maintenanceAssignedDevName || "Assigned Lead"}`
                                : "Keep your live website fast, bug-free, and updated with dedicated engineer coverage"}
                            </p>
                          </div>
                        </div>

                        {order.maintenanceActive ? (
                          <Link href={`/dashboard/workspace?orderId=${order.id}`}>
                            <Button variant="accent" size="sm" className="rounded-xl text-xs flex items-center gap-1.5 shrink-0 bg-purple-600 hover:bg-purple-700">
                              <Sparkles className="w-3.5 h-3.5" /> Open Maintenance Desk
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            onClick={() =>
                              setPayingMilestoneOrder({
                                order,
                                milestone: "maintenance",
                                amount: 1999,
                                title: "30-Day Website Maintenance Retainer",
                              })
                            }
                            variant="accent"
                            size="sm"
                            className="rounded-xl text-xs flex items-center gap-1.5 shrink-0 bg-purple-600 hover:bg-purple-700 font-bold"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Activate Maintenance (₹1,999/mo)
                          </Button>
                        )}
                      </div>

                      {/* Maintenance Feature Perks */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-zinc-300 pt-2 border-t border-white/5">
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white block">Uptime & Security</span>
                            <span className="text-[11px] text-zinc-500">24/7 monitoring, backups & patches</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
                          <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white block">Priority Bug Fixes</span>
                            <span className="text-[11px] text-zinc-500">Fast resolution for live site issues</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
                          <Code className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white block">Content & Feature Tweaks</span>
                            <span className="text-[11px] text-zinc-500">Deploy copy, asset & layout edits</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Query Box if any */}
                  {order.hasPendingQuery && order.adminQuery && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <AlertCircle className="w-4 h-4" /> Message from Admin Team:
                      </div>
                      <p className="text-xs text-white">{order.adminQuery}</p>
                      {respondingOrderId === order.id ? (
                        <div className="space-y-2 pt-2">
                          <textarea
                            rows={2}
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Type your response or clarification..."
                            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                          />
                          <div className="flex justify-end gap-2">
                            <Button onClick={() => setRespondingOrderId(null)} variant="ghost" size="sm" className="text-xs">
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleRespondToQuery(order.id)}
                              variant="accent"
                              size="sm"
                              disabled={submittingResponse}
                              className="text-xs"
                            >
                              Send Response
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setRespondingOrderId(order.id)}
                          variant="accent"
                          size="sm"
                          className="rounded-xl text-xs h-7"
                        >
                          Reply to Admin
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Developer Interaction Room (Expandable) */}
                  {openRoomOrderId === order.id && (
                    <div className="pt-4 border-t border-white/5">
                      <DeveloperInteractionRoom
                        orderId={order.id}
                        orderStatus={order.status}
                        planName={order.planName}
                        currentUserId={user?.uid || ""}
                        currentUserName={user?.displayName || profile?.name || "Client"}
                        currentUserRole="user"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Interactive Milestone Payment & UTR Verification Modal ── */}
      <AnimatePresence>
        {payingMilestoneOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              onClick={() => setPayingMilestoneOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-[#111] border border-white/15 rounded-3xl w-full max-w-xl p-6 sm:p-8 relative shadow-2xl my-8">
                <button
                  onClick={() => setPayingMilestoneOrder(null)}
                  className="absolute top-5 right-5 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Modal Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {payingMilestoneOrder.title}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Project: <span className="text-zinc-200 font-medium">{payingMilestoneOrder.order.planName}</span>
                    </p>
                  </div>
                </div>

                {/* Amount Due Banner */}
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider block">
                      Amount Due
                    </span>
                    <span className="text-2xl font-black text-white">
                      ₹{payingMilestoneOrder.amount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                    {payingMilestoneOrder.milestone === "advance"
                      ? "Milestone 1 (50%)"
                      : payingMilestoneOrder.milestone === "final"
                      ? "Milestone 4 (50%)"
                      : "Maintenance Retainer"}
                  </span>
                </div>

                {/* Payment Method Selector Tabs */}
                <div className="flex items-center gap-2 p-1 bg-white/[0.04] border border-white/10 rounded-xl mb-5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentTab("upi")}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentTab === "upi"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" /> Direct UPI / QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTab("gateway")}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentTab === "gateway"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Online Gateway (Paytm)
                  </button>
                </div>

                {/* TAB 1: Direct UPI QR Code & UTR Submission */}
                {paymentTab === "upi" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center space-y-3">
                      <p className="text-xs text-amber-300 font-medium">
                        Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM)
                      </p>

                      {/* Dynamic Amount QR Code */}
                      <div className="w-40 h-40 mx-auto bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center border border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            paymentSettings.qrCodeUrl ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                              `upi://pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(
                                paymentSettings.upiName
                              )}&am=${payingMilestoneOrder.amount}&cu=INR`
                            )}`
                          }
                          alt="Scan UPI QR Code"
                          className="w-full h-full object-contain rounded-xl"
                        />
                      </div>

                      {/* UPI ID & Number with Copy Buttons */}
                      <div className="space-y-2 pt-1">
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-left">
                          <div className="min-w-0">
                            <span className="text-[10px] text-zinc-500 uppercase block font-bold">UPI ID:</span>
                            <span className="text-xs font-mono font-bold text-indigo-300 truncate block">
                              {paymentSettings.upiId}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(paymentSettings.upiId);
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="text-[10px]">{copiedUpi ? "Copied" : "Copy"}</span>
                          </button>
                        </div>

                        {paymentSettings.upiNumber && (
                          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-left">
                            <div className="min-w-0">
                              <span className="text-[10px] text-zinc-500 uppercase block font-bold">Paytm / PhonePe Number:</span>
                              <span className="text-xs font-mono font-bold text-indigo-300 truncate block">
                                {paymentSettings.upiNumber}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentSettings.upiNumber || "");
                                setCopiedPhone(true);
                                setTimeout(() => setCopiedPhone(false), 2000);
                              }}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                            >
                              {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span className="text-[10px]">{copiedPhone ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* UTR Submission Form */}
                    <form onSubmit={handleSubmitUtr} className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Bank UTR / UPI Transaction Reference ID <span className="text-indigo-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={utrInput}
                          onChange={(e) => setUtrInput(e.target.value)}
                          placeholder="e.g. 423189023412 or UPI Ref No"
                          className="w-full bg-[#18181b] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Enter the 12-digit reference number generated after completing your UPI transfer.
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPayingMilestoneOrder(null)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="accent"
                          size="sm"
                          disabled={submittingUtr || !utrInput.trim()}
                          className="text-xs flex items-center gap-1.5"
                        >
                          {submittingUtr ? (
                            "Verifying..."
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Submit UTR for Bank Verification
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB 2: Online Payment Gateway (Paytm) */}
                {paymentTab === "gateway" && (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2 text-xs text-zinc-300">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" /> Paytm Secure Payment Gateway
                      </div>
                      <p>
                        Pay securely with Netbanking, Debit Card, Credit Card, or Paytm Wallet.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                      <div className="text-xs text-zinc-400">
                        Click below to launch the gateway checkout session for ₹{payingMilestoneOrder.amount.toLocaleString()}.
                      </div>
                      <Button
                        type="button"
                        variant="accent"
                        size="sm"
                        disabled={initiatingPaytm}
                        onClick={() =>
                          handlePaytmCheckout(
                            payingMilestoneOrder.order,
                            payingMilestoneOrder.milestone,
                            payingMilestoneOrder.amount,
                            true
                          )
                        }
                        className="w-full h-11 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        {initiatingPaytm ? (
                          "Initiating Secure Gateway..."
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" /> Proceed with Online Gateway (₹{payingMilestoneOrder.amount.toLocaleString()})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
