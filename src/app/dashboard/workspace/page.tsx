"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import DeveloperInteractionRoom from "@/components/dashboard/DeveloperInteractionRoom";
import {
  MessageSquare,
  FolderKanban,
  Lock,
  ChevronDown,
  ChevronUp,
  Globe,
  Code2,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  X,
  UserCheck,
  Check,
  AlertCircle,
  FileText,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import MaintenanceDesk from "@/components/dashboard/MaintenanceDesk";

interface Order {
  id: string;
  planName: string;
  price?: number;
  totalPrice?: number;
  advancePrice?: number;
  advancePaid?: boolean;
  finalPrice?: number;
  finalPaid?: boolean;
  currency?: string;
  status: string;
  userEmail?: string;
  userId?: string;
  utrNumber?: string;
  paymentMethod?: string;
  assignedDeveloperId?: string;
  assignedDeveloperName?: string;
  assignedDeveloperEmail?: string;
  assignedAt?: string;
  maintenanceActive?: boolean;
  maintenancePaid?: boolean;
  maintenancePaidAt?: string;
  maintenanceExpiresAt?: string;
  maintenanceAssignedDevId?: string;
  maintenanceAssignedDevName?: string;
  maintenanceAssignedDevEmail?: string;
  maintenanceAssignmentMode?: string;
  maintenanceAmount?: number;
  stagingUrl?: string;
  devStage?: "in_progress" | "testing" | "staging_deployed";
  createdAt: any;
  formData?: {
    name?: string;
    email?: string;
    company?: string;
    projectType?: string;
    timeline?: string;
    details?: string;
  };
  details?: string;
  statusCaption?: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  awaiting_final_payment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  awaiting_verification: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pending_payment: "bg-red-500/10 text-red-400 border-red-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const LOCKED_STATUSES = ["pending_payment", "awaiting_verification", "cancelled", "rejected"];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

export default function WorkspacePage() {
  const { user, profile, loading, isDeveloper, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [workspaceSection, setWorkspaceSection] = useState<"sprints" | "maintenance">("sprints");
  const [workspaceTabs, setWorkspaceTabs] = useState<Record<string, "sprint" | "maintenance">>({});

  // Submit Work Modal State
  const [submittingWorkOrder, setSubmittingWorkOrder] = useState<Order | null>(null);
  const [stagingUrlInput, setStagingUrlInput] = useState("");
  const [workNotesInput, setWorkNotesInput] = useState("");
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Updating Dev Stage state
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    setFetchingOrders(true);

    const handleSnap = (data: Order[]) => {
      data.sort((a, b) => {
        const priority = (s: string) =>
          s === "in_progress" ? 0 : s === "awaiting_final_payment" ? 1 : s === "completed" ? 2 : 3;
        return priority(a.status) - priority(b.status);
      });
      setOrders(data);
      setOpenOrderId((prev) => {
        if (prev && data.some((o) => o.id === prev)) return prev;
        const firstActive = data.find((o) => !LOCKED_STATUSES.includes(o.status));
        return firstActive ? firstActive.id : null;
      });
      setFetchingOrders(false);
    };

    if (isAdmin || isSuperAdmin) {
      const unsub = onSnapshot(
        collection(db, "orders"),
        (snap) => handleSnap(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))),
        (err) => {
          console.error("Realtime admin orders error:", err);
          setFetchingOrders(false);
        }
      );
      return () => unsub();
    } else if (isDeveloper) {
      const qDev = query(collection(db, "orders"), where("assignedDeveloperId", "==", user.uid));
      const qMaint = query(collection(db, "orders"), where("maintenanceAssignedDevId", "==", user.uid));

      let devOrders: Order[] = [];
      let maintOrders: Order[] = [];

      const updateCombined = () => {
        const map = new Map<string, Order>();
        devOrders.forEach((o) => map.set(o.id, o));
        maintOrders.forEach((o) => map.set(o.id, o));
        handleSnap(Array.from(map.values()));
      };

      const unsub1 = onSnapshot(qDev, (snap) => {
        devOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        updateCombined();
      });
      const unsub2 = onSnapshot(qMaint, (snap) => {
        maintOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        updateCombined();
      });

      return () => {
        unsub1();
        unsub2();
      };
    } else {
      const q = query(collection(db, "orders"), where("userId", "==", user.uid));
      const unsub = onSnapshot(
        q,
        (snap) => handleSnap(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))),
        (err) => {
          console.error("Realtime client orders error:", err);
          setFetchingOrders(false);
        }
      );
      return () => unsub();
    }
  }, [user, loading, isDeveloper, isAdmin, isSuperAdmin, router]);

  // Handler: Initiate Maintenance Checkout
  const handleInitiateMaintenanceCheckout = async (order: Order, amount: number = 1999, couponCode?: string) => {
    try {
      const res = await fetch("/api/payments/paytm/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount,
          milestone: "maintenance",
          userEmail: user?.email || order.userEmail,
          userName: user?.displayName || profile?.name || "Client",
          couponCode: couponCode || null,
        }),
      });

      const data = await res.json();

      if (data.simulated) {
        await fetch(`/api/payments/paytm/callback?orderId=${order.id}&milestone=maintenance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            STATUS: "TXN_SUCCESS",
            ORDERID: data.orderId,
            TXNAMOUNT: amount.toString(),
            TXNID: `PAYTM_SIM_${Date.now()}`,
            simulated: true,
          }),
        });
        alert("30-Day Website Maintenance Retainer activated successfully!");
      } else if (data.txnToken) {
        window.location.href = `${data.callbackUrl}&txnToken=${data.txnToken}`;
      }
    } catch (e) {
      console.error("Maintenance checkout error:", e);
      alert("Failed to initiate maintenance checkout.");
    }
  };

  // Handler: Update Development Stage
  const handleUpdateDevStage = async (orderId: string, stage: "in_progress" | "testing" | "staging_deployed") => {
    setUpdatingStageId(orderId);
    try {
      const stageLabels: Record<string, string> = {
        in_progress: "In Active Development",
        testing: "Testing & Quality Assurance",
        staging_deployed: "Staging Deployed & Review",
      };

      await updateDoc(doc(db, "orders", orderId), {
        devStage: stage,
        statusCaption: stageLabels[stage] || stage,
        updatedAt: new Date().toISOString(),
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, devStage: stage, statusCaption: stageLabels[stage] } : o))
      );
    } catch (e) {
      console.error("Failed to update dev stage:", e);
      alert("Failed to update status stage");
    } finally {
      setUpdatingStageId(null);
    }
  };

  // Handler: Submit Completed Work & Notify Client
  const handleSubmitWork = async () => {
    if (!submittingWorkOrder) return;
    if (!stagingUrlInput.trim()) {
      alert("Please provide a valid Staging Demo URL");
      return;
    }

    setIsSubmittingWork(true);
    try {
      const orderId = submittingWorkOrder.id;
      const stagingUrl = stagingUrlInput.trim();
      const devName = profile?.name || user?.displayName || "Your Developer";
      const totalAmount = submittingWorkOrder.totalPrice || submittingWorkOrder.price || 0;
      const finalAmount =
        submittingWorkOrder.finalPrice ||
        (submittingWorkOrder.totalPrice
          ? Math.round(submittingWorkOrder.totalPrice * 0.5)
          : Math.round(totalAmount * 0.5));

      await updateDoc(doc(db, "orders", orderId), {
        status: "awaiting_final_payment",
        stagingUrl,
        devNotes: workNotesInput.trim() || null,
        devCompletedAt: new Date().toISOString(),
        statusCaption: "Work Completed — Staging Ready for Client Review 🚀",
        updatedAt: new Date().toISOString(),
      });

      // Send real-time notification to client
      await addDoc(collection(db, "notifications"), {
        title: "🚀 Project Completed by Developer — Final 50% Milestone Ready!",
        message: `${devName} has completed the development sprint for "${submittingWorkOrder.planName}". Live staging demo is ready for review at: ${stagingUrl}. Settle the final 50% milestone (₹${finalAmount.toLocaleString()}) to unlock full code repository and handover assets.`,
        actionLink: stagingUrl,
        actionText: "Preview Staging",
        targetType: "user",
        targetUserId: submittingWorkOrder.userId || null,
        targetEmail: submittingWorkOrder.userEmail || null,
        senderName: devName,
        senderRole: isDeveloper ? "Developer" : "Admin",
        createdAt: new Date().toISOString(),
        readBy: [],
        clearedBy: [],
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "awaiting_final_payment",
                stagingUrl,
                statusCaption: "Work Completed — Staging Ready for Client Review 🚀",
              }
            : o
        )
      );

      setSubmittingWorkOrder(null);
      setStagingUrlInput("");
      setWorkNotesInput("");
      alert("Work submitted! The client has been notified to preview staging and settle the final 50% milestone.");
    } catch (e) {
      console.error("Failed to submit work:", e);
      alert("Failed to submit work");
    } finally {
      setIsSubmittingWork(false);
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
          <h1 className="text-2xl font-jakarta font-bold text-white">
            {isDeveloper ? "Developer Workspace" : "Project Workspace"}
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {isDeveloper
              ? "Live communication room with your assigned clients — share live previews, code repositories, and work updates."
              : "Direct communication with your assigned development team — share files, links, feedback, and project updates."}
          </p>
        </div>
      </motion.div>

      {/* Top-Level Section Navigation for Developers */}
      {isDeveloper && (
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <button
            onClick={() => setWorkspaceSection("sprints")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              workspaceSection === "sprints"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                : "bg-white/[0.02] text-zinc-400 border border-white/5 hover:text-white hover:border-white/10"
            }`}
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Active Sprints</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              workspaceSection === "sprints" ? "bg-cyan-500/30 text-cyan-200" : "bg-white/5 text-zinc-500"
            }`}>
              {orders.filter((o) => o.status !== "completed").length}
            </span>
          </button>

          <button
            onClick={() => setWorkspaceSection("maintenance")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              workspaceSection === "maintenance"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10"
                : "bg-white/[0.02] text-zinc-400 border border-white/5 hover:text-white hover:border-white/10"
            }`}
          >
            <Wrench className="w-4 h-4 text-purple-400" />
            <span>Maintenance Requests</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              workspaceSection === "maintenance" ? "bg-purple-500/30 text-purple-200" : "bg-white/5 text-zinc-500"
            }`}>
              {orders.filter((o) => o.maintenanceActive).length}
            </span>
          </button>
        </div>
      )}

      {/* Orders List & Empty State */}
      {(() => {
        const displayedOrders = isDeveloper
          ? workspaceSection === "sprints"
            ? orders.filter((o) => o.status !== "completed")
            : orders.filter((o) => o.maintenanceActive)
          : orders;

        if (displayedOrders.length === 0) {
          return (
            <motion.div
              {...fadeUp}
              className="text-center py-24 px-6 text-zinc-500 border border-white/5 rounded-2xl bg-white/[0.02] flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                {isDeveloper && workspaceSection === "maintenance" ? (
                  <Wrench className="w-8 h-8 text-purple-400" />
                ) : (
                  <FolderKanban className="w-8 h-8 text-zinc-600" />
                )}
              </div>
              <p className="text-base font-semibold text-white mb-1">
                {isDeveloper
                  ? workspaceSection === "maintenance"
                    ? "No Maintenance Requests Assigned"
                    : "No Active Sprints Assigned"
                  : "No Active Workspaces"}
              </p>
              <p className="text-sm max-w-md mx-auto">
                {isDeveloper
                  ? workspaceSection === "maintenance"
                    ? "When a client subscribes to post-delivery maintenance and you are assigned as the maintenance engineer, all client task tickets will appear here."
                    : "You do not have any active build sprints assigned currently. Once assigned by an admin, projects will appear here."
                  : "Submit a project inquiry or purchase a plan from the pricing page to get started."}
              </p>
            </motion.div>
          );
        }

        return (
          <div className="space-y-6">
            {/* Legend */}
            <motion.div
              {...fadeUp}
              className="flex flex-wrap items-center justify-between gap-3 text-[11px] px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-zinc-500 font-medium">Room Status:</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Unlocked & Interactive
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Lock className="w-3 h-3" /> Locked (Pending Advance)
                </span>
              </div>
              <span className="text-zinc-500">
                Total: {displayedOrders.length} {displayedOrders.length === 1 ? "project" : "projects"}
              </span>
            </motion.div>

            <div className="space-y-4">
              {displayedOrders.map((order, i) => {
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
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <button
                          onClick={() => setOpenOrderId(isOpen ? null : order.id)}
                          className="flex items-start gap-4 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isLocked
                                ? "bg-zinc-800 text-zinc-500"
                                : isDeveloper && workspaceSection === "maintenance"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-indigo-500/10 text-indigo-400"
                            }`}
                          >
                            {isLocked ? (
                              <Lock className="w-5 h-5" />
                            ) : isDeveloper && workspaceSection === "maintenance" ? (
                              <Wrench className="w-5 h-5" />
                            ) : (
                              <MessageSquare className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-base font-bold text-white truncate">{order.planName}</p>
                              {order.userEmail && (
                                <span className="text-[11px] text-zinc-500">
                                  · Client: <span className="text-zinc-300 font-medium">{order.userEmail}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusColor}`}
                              >
                                {order.status?.replace(/_/g, " ")}
                              </span>
                              {!isDeveloper && (
                                <span className="text-xs text-zinc-400 font-mono">
                                  ₹{(order.totalPrice || order.price || 0).toLocaleString()}
                                </span>
                              )}
                              {order.stagingUrl && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                  Staging Live
                                </span>
                              )}
                              {order.maintenanceActive && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Maintenance Active
                                </span>
                              )}
                            </div>

                            {order.statusCaption && (
                              <p className="text-xs text-zinc-400 mt-1 italic">
                                Status Update: <span className="text-zinc-200">{order.statusCaption}</span>
                              </p>
                            )}

                            {order.status === "awaiting_verification" && (
                              <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold block text-white">Deposit Verification in Progress</span>
                                  <span>
                                    {order.utrNumber
                                      ? `We received your UTR reference (${order.utrNumber}). Our team is verifying your payment with the bank. Your sprint will unlock upon approval.`
                                      : "Your 50% advance deposit is undergoing verification. Your sprint will unlock shortly."}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {/* Developer Stage Controls */}
                          {isDeveloper && order.status !== "completed" && !isLocked && (
                            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1">
                              <button
                                disabled={updatingStageId === order.id}
                                onClick={() => handleUpdateDevStage(order.id, "in_progress")}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                                  order.devStage === "in_progress" || (!order.devStage && order.status === "in_progress")
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                Building
                              </button>
                              <button
                                disabled={updatingStageId === order.id}
                                onClick={() => handleUpdateDevStage(order.id, "testing")}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                                  order.devStage === "testing"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                Testing
                              </button>
                              <button
                                onClick={() => {
                                  setSubmittingWorkOrder(order);
                                  setStagingUrlInput(order.stagingUrl || "");
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer shadow-sm"
                              >
                                Submit Staging
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => setOpenOrderId(isOpen ? null : order.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer"
                          >
                            {!isLocked && (
                              <span className="text-[11px] font-medium text-indigo-300">
                                {isOpen ? "Hide Drawer" : "Open Drawer"}
                              </span>
                            )}
                            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Open Workspace Drawer ── */}
                    {isOpen && (
                      <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                        {/* If viewing Maintenance Requests section as Developer */}
                        {isDeveloper && workspaceSection === "maintenance" ? (
                          <MaintenanceDesk
                            order={order}
                            currentUserId={user?.uid || ""}
                            currentUserRole="developer"
                            currentUserName={user?.displayName || profile?.name || "Maintenance Engineer"}
                          />
                        ) : (
                          <>
                            {/* Sub-Tab Switcher for Clients on Completed Projects */}
                            {!isDeveloper && order.status === "completed" && (
                              <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-xl w-fit">
                                <button
                                  onClick={() => setWorkspaceTabs((prev) => ({ ...prev, [order.id]: "sprint" }))}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    (workspaceTabs[order.id] || "sprint") === "sprint"
                                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                                      : "text-zinc-400 hover:text-white"
                                  }`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Sprint Room & Chat</span>
                                </button>

                                <button
                                  onClick={() => setWorkspaceTabs((prev) => ({ ...prev, [order.id]: "maintenance" }))}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    workspaceTabs[order.id] === "maintenance"
                                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
                                      : "text-zinc-400 hover:text-white"
                                  }`}
                                >
                                  <Wrench className="w-3.5 h-3.5 text-purple-400" />
                                  <span>Maintenance Desk</span>
                                  {order.maintenanceActive ? (
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-bold font-mono">
                                      ACTIVE
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded-full font-semibold">
                                      AVAILABLE
                                    </span>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Content Render */}
                            {!isDeveloper && order.status === "completed" && workspaceTabs[order.id] === "maintenance" ? (
                              <MaintenanceDesk
                                order={order}
                                currentUserId={user?.uid || ""}
                                currentUserRole="client"
                                currentUserName={user?.displayName || profile?.name || "Client"}
                                onInitiateCheckout={(amt, coupon) => handleInitiateMaintenanceCheckout(order, amt, coupon)}
                              />
                            ) : (
                              <div className="space-y-4">
                                {/* Expandable Client Requirements */}
                                {(order.formData || order.details) && (
                                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1.5 text-zinc-300">
                                    <p className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                      Client Project Requirements
                                    </p>
                                    {order.formData?.company && <p><span className="text-zinc-500">Company:</span> {order.formData.company}</p>}
                                    {order.formData?.projectType && <p><span className="text-zinc-500">Project Type:</span> {order.formData.projectType}</p>}
                                    {order.formData?.timeline && <p><span className="text-zinc-500">Timeline:</span> {order.formData.timeline}</p>}
                                    {(order.formData?.details || order.details) && (
                                      <p className="mt-1 p-2 bg-black/40 rounded border border-white/5 text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                        {order.formData?.details || order.details}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Live Interaction Chat Room */}
                                <DeveloperInteractionRoom
                                  orderId={order.id}
                                  orderStatus={order.status}
                                  planName={order.planName}
                                  currentUserId={user?.uid || ""}
                                  currentUserName={
                                    user?.displayName ||
                                    profile?.name ||
                                    (isDeveloper ? "Developer" : isAdmin ? "Admin" : "Client")
                                  }
                                  currentUserRole={isDeveloper || isAdmin ? "admin" : "user"}
                                  currentUserDesignation={profile?.designation}
                                  currentUserDepartment={profile?.department}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Submit Completed Work Modal ── */}
      <AnimatePresence>
        {submittingWorkOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setSubmittingWorkOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl space-y-5">
                <button
                  onClick={() => setSubmittingWorkOrder(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Submit Completed Project Work</h3>
                    <p className="text-xs text-zinc-500">
                      Order: {submittingWorkOrder.planName} ({submittingWorkOrder.userEmail})
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Live Staging Demo URL <span className="text-purple-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={stagingUrlInput}
                      onChange={(e) => setStagingUrlInput(e.target.value)}
                      placeholder="https://your-preview-demo.vercel.app"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      The client will preview this demo link to verify the finished sprint.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Developer Handover Notes / Summary (Optional)
                    </label>
                    <textarea
                      value={workNotesInput}
                      onChange={(e) => setWorkNotesInput(e.target.value)}
                      rows={3}
                      placeholder="e.g. All requested pages, responsive layouts, forms, and API integrations have been implemented and tested..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      Client Notification & 50% Settlement
                    </p>
                    <p className="text-[11px] text-purple-300/80 leading-relaxed">
                      Submitting will update the project status to <strong>Awaiting Final Payment</strong> and automatically send a priority notification to the client with the demo URL and a prompt to settle the remaining 50% balance before full code handover.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    onClick={() => setSubmittingWorkOrder(null)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitWork}
                    disabled={isSubmittingWork}
                    variant="accent"
                    size="sm"
                    className="rounded-xl flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    {isSubmittingWork ? "Submitting…" : "Submit & Notify Client"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
