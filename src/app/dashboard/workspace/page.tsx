"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  where,
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
  X,
  FileText,
  Wrench,
  ShieldCheck,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import MaintenanceDesk from "@/components/dashboard/MaintenanceDesk";
import Link from "next/link";
import { safeFetchJson, normalizeUrl } from "@/lib/safeFetch";

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
  demoUrl?: string;
  handoverLinks?: {
    githubRepo?: string | null;
    liveUrl?: string | null;
    driveZip?: string | null;
  } | null;
  handoverNotes?: string | null;
  devStage?: "in_progress" | "testing" | "staging_deployed";
  developerPayout?: {
    amount: number;
    percentage: number;
    status: "in_escrow" | "approved" | "paid";
    paidAt?: string;
    utr?: string;
    paymentMethod?: string;
    paidBy?: string;
    voucherNumber?: string;
    notes?: string;
  };
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
  completed: "bg-[#169B62]/10 text-[#169B62] border-[#169B62]/20",
  in_progress: "bg-[#315EF7]/10 text-[#315EF7] border-[#315EF7]/20",
  awaiting_final_payment: "bg-[#B77900]/10 text-[#B77900] border-[#B77900]/20",
  awaiting_verification: "bg-[#B77900]/10 text-[#B77900] border-[#B77900]/20",
  pending_payment: "bg-[#D83A3A]/10 text-[#D83A3A] border-[#D83A3A]/20",
  rejected: "bg-[#D83A3A]/10 text-[#D83A3A] border-[#D83A3A]/20",
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
  const [liveUrlInput, setLiveUrlInput] = useState("");
  const [githubRepoInput, setGithubRepoInput] = useState("");
  const [driveZipInput, setDriveZipInput] = useState("");
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
      const res = await safeFetchJson<any>("/api/payments/paytm/initiate", {
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

      if (!res.ok || !res.data?.success) {
        throw new Error(
          res.error || "Online Payment Gateway is currently under setup. Please use the UPI option."
        );
      }

      const data = res.data;
      if (data.txnToken && data.callbackUrl) {
        window.location.href = `${data.callbackUrl}&txnToken=${data.txnToken}`;
      } else {
        throw new Error("Online Payment Gateway is not configured. Please use Direct UPI.");
      }
    } catch (e: any) {
      console.error("Maintenance checkout error:", e);
      alert(e?.message || "Failed to initiate online payment session.");
    }
  };

  // Handler: Update Development Stage
  const handleUpdateDevStage = async (orderId: string, stage: "in_progress" | "testing" | "staging_deployed") => {
    setUpdatingStageId(orderId);
    try {
      const token = await user?.getIdToken();
      const res = await safeFetchJson<any>("/api/developer/orders/update-stage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, stage }),
      });
      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || "Failed to update status stage");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, devStage: stage, statusCaption: res.data?.caption } : o))
      );
    } catch (e: any) {
      console.error("Failed to update dev stage:", e);
      alert(e.message || "Failed to update status stage");
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
      const stagingUrl = normalizeUrl(stagingUrlInput.trim());
      const token = await user?.getIdToken();

      const handoverLinks = {
        liveUrl: liveUrlInput.trim() ? normalizeUrl(liveUrlInput.trim()) : undefined,
        githubRepo: githubRepoInput.trim() ? normalizeUrl(githubRepoInput.trim()) : undefined,
        driveZip: driveZipInput.trim() ? normalizeUrl(driveZipInput.trim()) : undefined,
      };

      const res = await safeFetchJson<any>("/api/developer/orders/submit-work", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          stagingUrl,
          devNotes: workNotesInput.trim() || undefined,
          handoverLinks,
          handoverNotes: workNotesInput.trim() || undefined,
        }),
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || "Failed to submit work");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
              ...o,
              status: "awaiting_final_payment",
              stagingUrl,
              handoverLinks: {
                ...o.handoverLinks,
                ...handoverLinks,
              },
              handoverNotes: workNotesInput.trim() || o.handoverNotes,
              statusCaption: "Work Completed — Staging Ready for Client Review 🚀",
            }
            : o
        )
      );

      setSubmittingWorkOrder(null);
      setStagingUrlInput("");
      setLiveUrlInput("");
      setGithubRepoInput("");
      setDriveZipInput("");
      setWorkNotesInput("");
      alert("Project build submitted successfully! Staging URL is now available to the client.");
    } catch (e: any) {
      console.error("Failed to submit work:", e);
      alert(e.message || "Failed to submit work");
    } finally {
      setIsSubmittingWork(false);
    }
  };

  if (loading || fetchingOrders) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-[rgba(21,24,29,0.10)] border-t-[#315EF7] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeUp} className="flex items-center gap-4">
        <div className="p-3 bg-[#315EF7]/10 rounded-2xl text-[#315EF7]">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl  font-bold text-[#111317]">
            {isDeveloper ? "Developer Workspace" : "Project Workspace"}
          </h1>
          <p className="text-sm text-[#4B5563] mt-0.5">
            {isDeveloper
              ? "Live communication room with your assigned clients — share live previews, code repositories, and work updates."
              : "Direct communication with your assigned development team — share files, links, feedback, and project updates."}
          </p>
        </div>
      </motion.div>

      {/* Top-Level Section Navigation for Developers */}
      {isDeveloper && (
        <div className="flex items-center gap-3 border-b border-[rgba(21,24,29,0.08)] pb-4">
          <button
            onClick={() => setWorkspaceSection("sprints")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${workspaceSection === "sprints"
                ? "bg-white text-[#111317] border border-[rgba(21,24,29,0.14)] shadow-xs"
                : "bg-[#FAFAFA] text-[#4B5563] border border-[rgba(21,24,29,0.08)] hover:text-[#111317]"
              }`}
          >
            <Code2 className="w-4 h-4 text-[#315EF7]" />
            <span>Active Sprints</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${workspaceSection === "sprints" ? "bg-[#315EF7]/10 text-[#315EF7]" : "bg-[#E5E7EB] text-[#6B7280]"
              }`}>
              {orders.filter((o) => o.status !== "completed").length}
            </span>
          </button>

          <button
            onClick={() => setWorkspaceSection("maintenance")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${workspaceSection === "maintenance"
                ? "bg-white text-[#111317] border border-[rgba(21,24,29,0.14)] shadow-xs"
                : "bg-[#FAFAFA] text-[#4B5563] border border-[rgba(21,24,29,0.08)] hover:text-[#111317]"
              }`}
          >
            <Wrench className="w-4 h-4 text-[#169B62]" />
            <span>Maintenance Requests</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${workspaceSection === "maintenance" ? "bg-[#169B62]/10 text-[#169B62]" : "bg-[#E5E7EB] text-[#6B7280]"
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
              className="text-center py-24 px-6 text-[#4B5563] border border-[rgba(21,24,29,0.10)] rounded-xl bg-white flex flex-col items-center justify-center min-h-[300px] shadow-[0_12px_40px_rgba(21,24,29,0.04)]"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA] border border-[rgba(21,24,29,0.08)] flex items-center justify-center mb-4 text-[#111317]">
                {isDeveloper && workspaceSection === "maintenance" ? (
                  <Wrench className="w-8 h-8 text-[#169B62]" />
                ) : (
                  <FolderKanban className="w-8 h-8 text-[#315EF7]" />
                )}
              </div>
              <p className="text-base font-semibold text-[#111317] mb-1">
                {isDeveloper
                  ? workspaceSection === "maintenance"
                    ? "No Maintenance Requests Assigned"
                    : "No Active Sprints Assigned"
                  : "No Active Workspaces"}
              </p>
              <p className="text-sm max-w-md mx-auto text-[#6B7280]">
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
              className="flex flex-wrap items-center justify-between gap-3 text-[11px] px-4 py-3 rounded-2xl bg-white border border-[rgba(21,24,29,0.10)] shadow-xs"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[#6B7280] font-medium">Room Status:</span>
                <span className="flex items-center gap-1.5 text-[#169B62] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#169B62]" /> Unlocked & Interactive
                </span>
                <span className="flex items-center gap-1.5 text-[#B77900] font-semibold">
                  <Lock className="w-3 h-3" /> Locked (Pending Advance)
                </span>
              </div>
              <span className="text-[#6B7280]">
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
                    className={`rounded-xl border transition-all duration-200 bg-white ${isOpen
                        ? "border-[rgba(21,24,29,0.18)] shadow-[0_16px_48px_rgba(21,24,29,0.08)]"
                        : "border-[rgba(21,24,29,0.10)] hover:border-[rgba(21,24,29,0.16)] shadow-[0_12px_40px_rgba(21,24,29,0.04)]"
                      }`}
                  >
                    {/* Order Header — click to expand/collapse */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <button
                          onClick={() => setOpenOrderId(isOpen ? null : order.id)}
                          className="flex items-start gap-4 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLocked
                                ? "bg-[#E5E7EB] text-[#6B7280]"
                                : isDeveloper && workspaceSection === "maintenance"
                                  ? "bg-[#169B62]/10 text-[#169B62]"
                                  : "bg-[#315EF7]/10 text-[#315EF7]"
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
                              <p className="text-base font-bold text-[#111317] truncate">{order.planName}</p>
                              {order.userEmail && (
                                <span className="text-[11px] text-[#6B7280]">
                                  · Client: <span className="text-[#4B5563] font-medium">{order.userEmail}</span>
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
                                <span className="text-xs text-[#4B5563] font-mono">
                                  ₹{(order.totalPrice || order.price || 0).toLocaleString()}
                                </span>
                              )}
                              {(order.stagingUrl || order.demoUrl) && (
                                <Link
                                  href={`/preview?url=${encodeURIComponent(normalizeUrl(order.stagingUrl || order.demoUrl || ""))}&title=${encodeURIComponent(order.planName || "Staging Demo")}&ref=/dashboard/workspace`}
                                  className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#315EF7]/10 text-[#315EF7] hover:bg-[#315EF7]/20 border border-[#315EF7]/20 flex items-center gap-1 transition-all"
                                  title="Open Live Web Viewer"
                                >
                                  <Globe className="w-3 h-3 text-[#315EF7]" /> Staging Live ↗
                                </Link>
                              )}
                              {order.maintenanceActive && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#169B62]/10 text-[#169B62] border border-[#169B62]/20 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-[#169B62]" /> Maintenance Active
                                </span>
                              )}
                            </div>

                            {order.statusCaption && (
                              <p className="text-xs text-[#4B5563] mt-1 italic">
                                Status Update: <span className="text-[#111317] font-medium">{order.statusCaption}</span>
                              </p>
                            )}

                            {order.status === "awaiting_verification" && (
                              <div className="mt-2.5 p-3 rounded-xl bg-[#B77900]/10 border border-[#B77900]/25 flex items-start gap-2.5 text-xs text-[#B77900]">
                                <Clock className="w-4 h-4 text-[#B77900] shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold block text-[#111317]">Deposit Verification in Progress</span>
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
                            <div className="flex items-center gap-1.5 bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] rounded-xl p-1">
                              <button
                                disabled={updatingStageId === order.id}
                                onClick={() => handleUpdateDevStage(order.id, "in_progress")}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-colors cursor-pointer ${order.devStage === "in_progress" || (!order.devStage && order.status === "in_progress")
                                    ? "bg-[#315EF7]/10 text-[#315EF7] font-bold"
                                    : "text-[#6B7280] hover:text-[#111317]"
                                  }`}
                              >
                                Building
                              </button>
                              <button
                                disabled={updatingStageId === order.id}
                                onClick={() => handleUpdateDevStage(order.id, "testing")}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded-lg transition-colors cursor-pointer ${order.devStage === "testing"
                                    ? "bg-[#B77900]/10 text-[#B77900] font-bold"
                                    : "text-[#6B7280] hover:text-[#111317]"
                                  }`}
                              >
                                Testing
                              </button>
                              <button
                                onClick={() => {
                                  setSubmittingWorkOrder(order);
                                  setStagingUrlInput(order.stagingUrl || "");
                                }}
                                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[#315EF7] hover:bg-[#2A50D4] text-white transition-colors cursor-pointer shadow-xs"
                              >
                                Submit Staging
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => setOpenOrderId(isOpen ? null : order.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] hover:bg-[#F1F2F4] border border-[rgba(21,24,29,0.10)] text-[#4B5563] hover:text-[#111317] text-xs transition-colors cursor-pointer"
                          >
                            {!isLocked && (
                              <span className="text-[11px] font-medium text-[#315EF7]">
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
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-4 border-t border-[rgba(21,24,29,0.08)] pt-4">
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
                              <div className="flex items-center gap-2 p-1 bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] rounded-xl w-fit">
                                <button
                                  onClick={() => setWorkspaceTabs((prev) => ({ ...prev, [order.id]: "sprint" }))}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${(workspaceTabs[order.id] || "sprint") === "sprint"
                                      ? "bg-white text-[#111317] border border-[rgba(21,24,29,0.12)] shadow-xs"
                                      : "text-[#4B5563] hover:text-[#111317]"
                                    }`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-[#315EF7]" />
                                  <span>Sprint Room & Chat</span>
                                </button>

                                <button
                                  onClick={() => setWorkspaceTabs((prev) => ({ ...prev, [order.id]: "maintenance" }))}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${workspaceTabs[order.id] === "maintenance"
                                      ? "bg-white text-[#111317] border border-[rgba(21,24,29,0.12)] shadow-xs"
                                      : "text-[#4B5563] hover:text-[#111317]"
                                    }`}
                                >
                                  <Wrench className="w-3.5 h-3.5 text-[#169B62]" />
                                  <span>Maintenance Desk</span>
                                  {order.maintenanceActive ? (
                                    <span className="text-[9px] bg-[#169B62]/10 text-[#169B62] px-1.5 py-0.2 rounded-full font-bold font-mono">
                                      ACTIVE
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-[#E5E7EB] text-[#6B7280] px-1.5 py-0.2 rounded-full font-semibold">
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
                                {/* Handover Assets & Deployment Package */}
                                {order.status === "completed" || order.finalPaid ? (
                                  <div className="p-4 rounded-2xl bg-[#169B62]/5 border border-[#169B62]/20 space-y-3">
                                    <div className="flex items-center gap-2 text-[#169B62] font-bold text-xs sm:text-sm">
                                      <CheckCircle2 className="w-4 h-4 text-[#169B62] shrink-0" />
                                      <span>Final Handover Assets & Code Repository Unlocked!</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                      {order.handoverLinks?.liveUrl && (
                                        <a
                                          href={order.handoverLinks.liveUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#111317] hover:bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] transition-colors font-medium shadow-xs"
                                        >
                                          <Globe className="w-3.5 h-3.5 text-[#315EF7]" /> Live Production URL ↗
                                        </a>
                                      )}
                                      {order.handoverLinks?.githubRepo && (
                                        <a
                                          href={order.handoverLinks.githubRepo}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#111317] hover:bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] transition-colors font-medium shadow-xs"
                                        >
                                          <Code2 className="w-3.5 h-3.5 text-[#111317]" /> GitHub Repository ↗
                                        </a>
                                      )}
                                      {order.handoverLinks?.driveZip && (
                                        <a
                                          href={order.handoverLinks.driveZip}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#111317] hover:bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] transition-colors font-medium shadow-xs"
                                        >
                                          <Download className="w-3.5 h-3.5 text-[#111317]" /> Source Code Zip ↗
                                        </a>
                                      )}
                                    </div>
                                    {order.handoverNotes && (
                                      <div className="p-3 bg-white rounded-xl border border-[rgba(21,24,29,0.08)] text-xs text-[#4B5563] space-y-1">
                                        <span className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider block">
                                          Handover Notes & Credentials:
                                        </span>
                                        <p className="whitespace-pre-wrap leading-relaxed text-[#111317]">{order.handoverNotes}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] space-y-2.5">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className="flex items-center gap-2 text-xs font-bold text-[#111317]">
                                        <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
                                        <span>Code Repository & Handover Package (Locked)</span>
                                      </div>
                                      {(order.stagingUrl || order.demoUrl) && (
                                        <Link
                                          href={`/preview?url=${encodeURIComponent(normalizeUrl(order.stagingUrl || order.demoUrl || ""))}&title=${encodeURIComponent(order.planName || "Staging Preview")}&ref=/dashboard/workspace`}
                                          className="text-xs font-bold px-3 py-1 rounded-xl bg-[#315EF7] hover:bg-[#2A50D4] text-white flex items-center gap-1.5 transition-all shadow-xs"
                                        >
                                          <Globe className="w-3.5 h-3.5" /> Preview Staging Demo ↗
                                        </Link>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-[#4B5563] leading-relaxed">
                                      GitHub repository ownership, source code zip, and production deployment keys are encrypted and protected. Complete the final 50% milestone settlement to release all assets instantly.
                                    </p>
                                  </div>
                                )}

                                {/* Expandable Client Requirements */}
                                {(order.formData || order.details) && (
                                  <div className="p-3.5 bg-[#FAFAFA] border border-[rgba(21,24,29,0.08)] rounded-2xl text-xs space-y-1.5 text-[#4B5563]">
                                    <p className="font-bold text-[#111317] uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-[#315EF7]" />
                                      Client Project Requirements
                                    </p>
                                    {order.formData?.company && <p><span className="text-[#6B7280]">Company:</span> {order.formData.company}</p>}
                                    {order.formData?.projectType && <p><span className="text-[#6B7280]">Project Type:</span> {order.formData.projectType}</p>}
                                    {order.formData?.timeline && <p><span className="text-[#6B7280]">Timeline:</span> {order.formData.timeline}</p>}
                                    {(order.formData?.details || order.details) && (
                                      <p className="mt-1 p-2.5 bg-white rounded-xl border border-[rgba(21,24,29,0.08)] text-[#111317] whitespace-pre-wrap leading-relaxed">
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
              className="fixed inset-0 z-50 bg-[#111317]/60 backdrop-blur-sm"
              onClick={() => setSubmittingWorkOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white border border-[rgba(21,24,29,0.12)] rounded-xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl space-y-5">
                <button
                  onClick={() => setSubmittingWorkOrder(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-[#6B7280] hover:text-[#111317] hover:bg-[#FAFAFA] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#315EF7]/10 flex items-center justify-center text-[#315EF7]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111317]">Submit Completed Project Work</h3>
                    <p className="text-xs text-[#4B5563]">
                      Order: {submittingWorkOrder.planName} ({submittingWorkOrder.userEmail})
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
                      Live Staging Demo URL <span className="text-[#315EF7]">*</span>
                    </label>
                    <input
                      type="url"
                      value={stagingUrlInput}
                      onChange={(e) => setStagingUrlInput(e.target.value)}
                      placeholder="https://your-preview-demo.vercel.app"
                      className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl px-4 py-2.5 text-sm text-[#111317] placeholder:text-[#6B7280] focus:outline-none focus:border-[#315EF7] focus:bg-white transition-colors"
                    />
                    <p className="text-[11px] text-[#6B7280] mt-1">
                      The client will preview this demo link to verify the finished sprint.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
                      GitHub Repository Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={githubRepoInput}
                      onChange={(e) => setGithubRepoInput(e.target.value)}
                      placeholder="https://github.com/runix/client-repo"
                      className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl px-4 py-2.5 text-xs text-[#111317] placeholder:text-[#6B7280] focus:outline-none focus:border-[#315EF7] focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
                      Source Code Download / Drive Zip Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={driveZipInput}
                      onChange={(e) => setDriveZipInput(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl px-4 py-2.5 text-xs text-[#111317] placeholder:text-[#6B7280] focus:outline-none focus:border-[#315EF7] focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
                      Developer Handover Notes / Summary (Optional)
                    </label>
                    <textarea
                      value={workNotesInput}
                      onChange={(e) => setWorkNotesInput(e.target.value)}
                      rows={2}
                      placeholder="e.g. All requested pages, responsive layouts, forms, and API integrations have been implemented and tested..."
                      className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl p-3 text-xs text-[#111317] placeholder:text-[#6B7280] focus:outline-none focus:border-[#315EF7] focus:bg-white transition-colors resize-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#315EF7]/5 border border-[#315EF7]/20 text-xs text-[#111317] space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-[#315EF7]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#315EF7]" />
                      Client Notification & 50% Settlement
                    </p>
                    <p className="text-[11px] text-[#4B5563] leading-relaxed">
                      Submitting will update the project status to <strong>Awaiting Final Payment</strong> and automatically send a priority notification to the client with the demo URL and a prompt to settle the remaining 50% balance before full code handover.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    onClick={() => setSubmittingWorkOrder(null)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitWork}
                    disabled={isSubmittingWork}
                    variant="accent"
                    size="sm"
                    className="rounded-xl flex items-center gap-2 bg-[#315EF7] hover:bg-[#2A50D4] text-white text-xs"
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
