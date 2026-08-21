"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  FolderKanban,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageCircle,
  Globe,
  AlertCircle,
  Briefcase,
  Shield,
  Sparkles,
  X,
  FileText,
  Send,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import DeveloperInteractionRoom from "@/components/dashboard/DeveloperInteractionRoom";
import MaintenanceDesk from "@/components/dashboard/MaintenanceDesk";

const fadeUp: any = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0,
  awaiting_final_payment: 1,
  pending_payment: 2,
  awaiting_verification: 3,
  completed: 4,
};

export default function DeveloperPortal() {
  const { user, profile, loading, isDeveloper, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [devPortalTab, setDevPortalTab] = useState<"sprints" | "maintenance">("sprints");
  const [openRoomOrderId, setOpenRoomOrderId] = useState<string | null>(null);
  const [devTabs, setDevTabs] = useState<Record<string, "chat" | "maintenance">>({});

  // Submit Work Modal State
  const [submittingWorkOrder, setSubmittingWorkOrder] = useState<any | null>(null);
  const [stagingUrlInput, setStagingUrlInput] = useState("");
  const [workNotesInput, setWorkNotesInput] = useState("");
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Updating Dev Stage state
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null);

  // Redirect non-developers
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && user && !isDeveloper && !isAdmin && !isSuperAdmin) {
      router.push("/dashboard");
      return;
    }
  }, [user, loading, isDeveloper, isAdmin, isSuperAdmin, router]);

  // Real-time listener for assigned orders and maintenance assignments
  useEffect(() => {
    if (!user) return;

    const qDev = query(
      collection(db, "orders"),
      where("assignedDeveloperId", "==", user.uid)
    );

    const qMaint = query(
      collection(db, "orders"),
      where("maintenanceAssignedDevId", "==", user.uid)
    );

    let devOrders: any[] = [];
    let maintOrders: any[] = [];

    const handleCombine = () => {
      const map = new Map<string, any>();
      devOrders.forEach((o) => map.set(o.id, o));
      maintOrders.forEach((o) => map.set(o.id, o));
      const combined = Array.from(map.values());

      // Sort: active first, then by status priority
      combined.sort((a: any, b: any) => {
        const aOrder = STATUS_ORDER[a.status] ?? 99;
        const bOrder = STATUS_ORDER[b.status] ?? 99;
        return aOrder - bOrder;
      });

      setOrders(combined);
      setLoadingOrders(false);
    };

    const unsub1 = onSnapshot(
      qDev,
      (snap) => {
        devOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        handleCombine();
      },
      (err) => {
        console.warn("Developer orders listener:", err?.message || err);
        setLoadingOrders(false);
      }
    );

    const unsub2 = onSnapshot(
      qMaint,
      (snap) => {
        maintOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        handleCombine();
      },
      (err) => {
        console.warn("Maintenance orders listener:", err?.message || err);
        setLoadingOrders(false);
      }
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  // Handler: Update Development Stage
  const handleUpdateDevStage = async (orderId: string, stage: "in_progress" | "testing" | "staging_deployed") => {
    setUpdatingStageId(orderId);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/developer/orders/update-stage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, stage }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status stage");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, devStage: stage, statusCaption: data.caption } : o))
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
      const stagingUrl = stagingUrlInput.trim();
      const token = await user?.getIdToken();

      const res = await fetch("/api/developer/orders/submit-work", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          stagingUrl,
          devNotes: workNotesInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit work");
      }

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
    } catch (e: any) {
      console.error("Failed to submit work:", e);
      alert(e.message || "Failed to submit work");
    } finally {
      setIsSubmittingWork(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = orders.filter((o) => o.status !== "completed").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;
  const maxProjects = profile?.maxProjects || 5;
  const capacityPct = Math.round((activeCount / maxProjects) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fadeUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-[#0e0e0e] to-indigo-500/10 border border-white/5 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.08)_0%,transparent_60%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
              <Code2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Developer Portal
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                Welcome back, <span className="text-cyan-300 font-semibold">{profile?.name || user.displayName || "Developer"}</span>
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Active</p>
                <p className="text-lg font-black text-white leading-none">{activeCount}<span className="text-zinc-500 text-xs font-normal">/{maxProjects}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Completed</p>
                <p className="text-lg font-black text-white leading-none">{completedCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</p>
                <p className="text-lg font-black text-white leading-none">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="relative z-10 mt-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-zinc-500 font-medium">Workload Capacity</span>
            <span className={`text-[11px] font-bold ${
              capacityPct >= 100 ? "text-red-400" : capacityPct >= 80 ? "text-amber-400" : "text-cyan-400"
            }`}>
              {capacityPct}% ({activeCount}/{maxProjects} Slots Used)
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(capacityPct, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                capacityPct >= 100 ? "bg-red-500" : capacityPct >= 80 ? "bg-amber-500" : "bg-gradient-to-r from-cyan-500 to-indigo-500"
              }`}
            />
          </div>
        </div>
      </motion.div>

      {/* Top-Level Section Navigation: Active Sprints vs Maintenance Requests */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setDevPortalTab("sprints")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            devPortalTab === "sprints"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
              : "bg-white/[0.02] text-zinc-400 border border-white/5 hover:text-white hover:border-white/10"
          }`}
        >
          <Code2 className="w-4 h-4 text-cyan-400" />
          <span>Active Sprints</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            devPortalTab === "sprints" ? "bg-cyan-500/30 text-cyan-200" : "bg-white/5 text-zinc-500"
          }`}>
            {orders.filter((o) => o.status !== "completed").length}
          </span>
        </button>

        <button
          onClick={() => setDevPortalTab("maintenance")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            devPortalTab === "maintenance"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10"
              : "bg-white/[0.02] text-zinc-400 border border-white/5 hover:text-white hover:border-white/10"
          }`}
        >
          <Wrench className="w-4 h-4 text-purple-400" />
          <span>Maintenance Requests</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            devPortalTab === "maintenance" ? "bg-purple-500/30 text-purple-200" : "bg-white/5 text-zinc-500"
          }`}>
            {orders.filter((o) => o.maintenanceActive).length}
          </span>
        </button>
      </div>

      {/* Content Area */}
      {loadingOrders ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : devPortalTab === "sprints" ? (
        /* ── ACTIVE SPRINTS TAB ── */
        (() => {
          const sprintOrders = orders.filter((o) => o.status !== "completed");
          if (sprintOrders.length === 0) {
            return (
              <motion.div {...fadeUp} className="text-center py-20 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-zinc-600" />
                </div>
                <h2 className="text-xl font-bold text-white">No Active Sprints Assigned</h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  You currently have no development projects in progress. Once assigned by an admin, new builds will appear here for development stages and staging demo reviews.
                </p>
              </motion.div>
            );
          }

          return (
            <div className="space-y-4">
              {sprintOrders.map((o, idx) => {
                const isActive = o.status !== "completed";
                const isInProgress = o.status === "in_progress";
                const isAwaitingFinal = o.status === "awaiting_final_payment";
                const isCompleted = o.status === "completed";
                const advanceAmount = o.advancePrice || (o.totalPrice ? Math.round(o.totalPrice * 0.5) : 0);
                const finalAmount = o.finalPrice || (o.totalPrice ? o.totalPrice - advanceAmount : 0);

                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    className="rounded-2xl border p-6 space-y-4 bg-[#0e0e0e] border-white/5"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-base font-bold text-white">{o.planName}</h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              isCompleted
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isAwaitingFinal
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : isInProgress
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}
                          >
                            {o.status?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          Client: <span className="text-zinc-300 font-medium">{o.userEmail || o.email}</span>
                          {o.assignedAt && (
                            <span className="ml-2 text-zinc-600">
                              · Assigned {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(o.assignedAt))}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Developer Stage Selectors & Submit Work CTA */}
                        {isActive && (
                          <div className="flex items-center gap-2">
                            {/* Dev Stage Buttons */}
                            <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
                              <button
                                disabled={updatingStageId === o.id}
                                onClick={() => handleUpdateDevStage(o.id, "in_progress")}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                                  o.devStage === "in_progress" || (!o.devStage && o.status === "in_progress")
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                Building
                              </button>
                              <button
                                disabled={updatingStageId === o.id}
                                onClick={() => handleUpdateDevStage(o.id, "testing")}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                                  o.devStage === "testing"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                Testing
                              </button>
                            </div>

                            {/* Submit Work Button */}
                            <Button
                              onClick={() => {
                                setSubmittingWorkOrder(o);
                                setStagingUrlInput(o.stagingUrl || "");
                              }}
                              variant="accent"
                              size="sm"
                              className="text-xs rounded-xl flex items-center gap-1.5 shadow-md bg-purple-600 hover:bg-purple-500 text-white font-bold"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Submit Work
                            </Button>
                          </div>
                        )}

                        <div className="text-right shrink-0 pl-3 border-l border-white/5">
                          <p className="text-lg font-black text-white">
                            ₹{(o.totalPrice || o.price || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-zinc-500">Total Budget</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono border ${
                        o.advancePaid
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                      }`}>
                        Advance (50%): ₹{advanceAmount.toLocaleString()} {o.advancePaid ? "✓ Paid" : "• Due"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-mono border ${
                        o.finalPaid
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                      }`}>
                        Final (50%): ₹{finalAmount.toLocaleString()} {o.finalPaid ? "✓ Settled" : "• Due at Handover"}
                      </span>

                      {o.statusCaption && (
                        <span className="text-xs px-2.5 py-0.5 rounded bg-white/[0.03] border border-white/5 text-zinc-300">
                          Status: {o.statusCaption}
                        </span>
                      )}
                    </div>

                    {/* Staging Link */}
                    {o.stagingUrl && (
                      <div className="text-xs text-zinc-400 flex items-center gap-1.5 bg-purple-500/[0.05] p-2.5 rounded-xl border border-purple-500/10">
                        <Globe className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-purple-400 font-semibold">Live Staging Demo:</span>
                        <a
                          href={o.stagingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-300 underline hover:text-white transition-colors"
                        >
                          {o.stagingUrl}
                        </a>
                      </div>
                    )}

                    {/* Project Requirements (expandable) */}
                    {(o.formData || o.details) && (
                      <details className="group">
                        <summary className="text-[11px] text-indigo-300 hover:text-indigo-200 cursor-pointer transition-colors select-none font-medium">
                          View Client Project Requirements
                        </summary>
                        <div className="mt-2 p-3 bg-white/[0.02] border border-white/10 rounded-xl text-xs space-y-1.5 text-zinc-300">
                          {o.formData?.company && <p><span className="text-zinc-500">Company:</span> {o.formData.company}</p>}
                          {o.formData?.projectType && <p><span className="text-zinc-500">Type:</span> {o.formData.projectType}</p>}
                          {o.formData?.timeline && <p><span className="text-zinc-500">Timeline:</span> {o.formData.timeline}</p>}
                          {(o.formData?.details || o.details) && (
                            <div>
                              <span className="text-zinc-500 block mb-1">Details:</span>
                              <p className="p-2.5 bg-black/40 rounded-lg border border-white/5 text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                {o.formData?.details || o.details}
                              </p>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* Developer Sprint Chat Room Toggle */}
                    <div className="pt-3 border-t border-white/5">
                      <button
                        onClick={() =>
                          setOpenRoomOrderId(openRoomOrderId === o.id ? null : o.id)
                        }
                        className={`flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                          openRoomOrderId === o.id
                            ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-300"
                            : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {openRoomOrderId === o.id ? "Close" : "Open"} Sprint Room & Client Chat
                      </button>

                      <AnimatePresence>
                        {openRoomOrderId === o.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 overflow-hidden space-y-3"
                          >
                            <DeveloperInteractionRoom
                              orderId={o.id}
                              orderStatus={o.status}
                              planName={o.planName}
                              currentUserId={user?.uid || ""}
                              currentUserName={user?.displayName || profile?.name || "Developer"}
                              currentUserRole="admin"
                              currentUserDesignation={profile?.designation}
                              currentUserDepartment={profile?.department}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          );
        })()
      ) : (
        /* ── MAINTENANCE REQUESTS TAB ── */
        (() => {
          const maintenanceOrders = orders.filter((o) => o.maintenanceActive);
          if (maintenanceOrders.length === 0) {
            return (
              <motion.div {...fadeUp} className="text-center py-20 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Wrench className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">No Maintenance Requests Assigned</h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  When a client activates post-completion website maintenance and you are assigned as the maintenance engineer, their maintenance task tickets (bug fixes, content updates, SEO & tweaks) will appear here for you to work on.
                </p>
              </motion.div>
            );
          }

          return (
            <div className="space-y-6">
              {maintenanceOrders.map((o, idx) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  className="rounded-2xl border p-6 space-y-5 bg-gradient-to-b from-[#0e0e0e] to-black border-purple-500/20 shadow-xl"
                >
                  {/* Maintenance Retainer Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{o.planName}</h3>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                            MAINTENANCE ACTIVE
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Client: <span className="text-zinc-200 font-medium">{o.userEmail || o.email}</span>
                          {o.maintenanceExpiresAt && (
                            <span className="ml-2 text-zinc-500 font-mono">
                              · Retainer Expiry: {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(o.maintenanceExpiresAt))}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-3 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        Active Retainer SLA
                      </span>
                    </div>
                  </div>

                  {/* Embedded Maintenance Desk & Task Tickets */}
                  <MaintenanceDesk
                    order={o}
                    currentUserId={user?.uid || ""}
                    currentUserRole="developer"
                    currentUserName={user?.displayName || profile?.name || "Maintenance Engineer"}
                  />
                </motion.div>
              ))}
            </div>
          );
        })()
      )}

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
