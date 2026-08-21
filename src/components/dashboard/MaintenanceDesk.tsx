"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  X,
  ShieldCheck,
  Zap,
  Tag,
  Check,
  AlertCircle,
  CreditCard,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import DeveloperInteractionRoom from "@/components/dashboard/DeveloperInteractionRoom";

export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  category: "bug_fix" | "content_update" | "performance" | "feature_tweak" | "other";
  priority: "low" | "medium" | "urgent";
  status: "investigating" | "in_progress" | "resolved";
  createdAt: string;
  createdBy: string;
  createdByName: string;
  resolvedAt?: string;
  devNotes?: string;
}

interface MaintenanceDeskProps {
  order: any;
  currentUserId: string;
  currentUserRole: "client" | "developer" | "admin";
  currentUserName: string;
  onInitiateCheckout?: (amount: number, couponCode?: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  bug_fix: { label: "Bug Fix", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  content_update: { label: "Content Edit", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  performance: { label: "Speed & SEO", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  feature_tweak: { label: "Feature Tweak", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  other: { label: "General", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Low Priority", color: "text-zinc-400 bg-white/5 border-white/10" },
  medium: { label: "Medium", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  urgent: { label: "Urgent Priority", color: "text-red-400 bg-red-500/20 border-red-500/40 font-bold" },
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  investigating: { label: "Investigating", color: "bg-amber-500/10 text-amber-300 border-amber-500/20", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-300 border-blue-500/20", icon: Zap },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", icon: CheckCircle2 },
};

const BASE_RETAINER_PRICE = 1999;

export default function MaintenanceDesk({
  order,
  currentUserId,
  currentUserRole,
  currentUserName,
  onInitiateCheckout,
}: MaintenanceDeskProps) {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isRetainerModalOpen, setIsRetainerModalOpen] = useState(false);

  // Maintenance Retainer Coupon State
  const [maintCouponInput, setMaintCouponInput] = useState("");
  const [appliedMaintCoupon, setAppliedMaintCoupon] = useState<any | null>(null);
  const [maintCouponError, setMaintCouponError] = useState<string | null>(null);
  const [maintCouponLoading, setMaintCouponLoading] = useState(false);

  // New task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskCategory, setTaskCategory] = useState<MaintenanceTask["category"]>("bug_fix");
  const [taskPriority, setTaskPriority] = useState<MaintenanceTask["priority"]>("medium");
  const [submittingTask, setSubmittingTask] = useState(false);

  const isMaintenanceActive = !!order.maintenanceActive;
  const daysRemaining = order.maintenanceExpiresAt
    ? Math.max(0, Math.ceil((new Date(order.maintenanceExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Real-time listener for maintenance tasks subcollection
  useEffect(() => {
    if (!order.id) return;

    const q = query(
      collection(db, "orders", order.id, "maintenance_tasks"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaintenanceTask)));
        setLoadingTasks(false);
      },
      (err) => {
        console.warn("Maintenance tasks listener notice:", err?.message || err);
        setLoadingTasks(false);
      }
    );

    return () => unsub();
  }, [order.id]);

  // Handler: Apply Maintenance Coupon
  const handleApplyMaintCoupon = async () => {
    const code = maintCouponInput.trim().toUpperCase();
    if (!code) {
      setMaintCouponError("Please enter a promo code");
      return;
    }

    setMaintCouponLoading(true);
    setMaintCouponError(null);

    try {
      const snap = await getDocs(
        query(collection(db, "coupons"), where("code", "==", code))
      );

      if (snap.empty) {
        setMaintCouponError(`Invalid promo code "${code}". Please verify and try again.`);
        setAppliedMaintCoupon(null);
        setMaintCouponLoading(false);
        return;
      }

      const couponDoc = snap.docs[0];
      const coupon = couponDoc.data() as any;

      if (!coupon.isActive) {
        setMaintCouponError("This promo code is no longer active.");
        setAppliedMaintCoupon(null);
        setMaintCouponLoading(false);
        return;
      }

      const now = Date.now();
      if (coupon.startDate && now < new Date(coupon.startDate).getTime()) {
        setMaintCouponError("This promotion has not started yet.");
        setAppliedMaintCoupon(null);
        setMaintCouponLoading(false);
        return;
      }

      if (coupon.endDate && now > new Date(coupon.endDate).getTime()) {
        setMaintCouponError("This promo code has expired.");
        setAppliedMaintCoupon(null);
        setMaintCouponLoading(false);
        return;
      }

      // Scope validation: Must be "maintenance" or "all"
      const scope = coupon.scope || "all";
      if (scope !== "maintenance" && scope !== "all") {
        setMaintCouponError("This promo code is not applicable to Website Maintenance Retainers.");
        setAppliedMaintCoupon(null);
        setMaintCouponLoading(false);
        return;
      }

      if (coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) {
        setMaintCouponError("This promo code has reached its maximum usage limit.");
        setAppliedMaintCoupon(null);
        setMaintCouponLoading(false);
        return;
      }

      if (coupon.usedByUsers && (coupon.usedByUsers.includes(currentUserId) || coupon.usedByUsers.includes(order.userEmail))) {
        setMaintCouponError("You have already redeemed this promo code.");
        setAppliedMaintCoupon(null);
        setMaintCouponLoading(false);
        return;
      }

      let discount = 0;
      if (coupon.type === "percentage") {
        discount = Math.round(BASE_RETAINER_PRICE * (coupon.value / 100));
        if (coupon.maxDiscount && coupon.maxDiscount > 0) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else {
        discount = Math.min(coupon.value, BASE_RETAINER_PRICE);
      }

      const finalPrice = Math.max(0, BASE_RETAINER_PRICE - discount);

      setAppliedMaintCoupon({
        id: couponDoc.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount: discount,
        finalPrice: finalPrice,
      });
      setMaintCouponError(null);
    } catch (err: any) {
      console.error("Maintenance coupon error:", err);
      setMaintCouponError("Failed to validate promo code.");
    } finally {
      setMaintCouponLoading(false);
    }
  };

  const handleRemoveMaintCoupon = () => {
    setAppliedMaintCoupon(null);
    setMaintCouponInput("");
    setMaintCouponError(null);
  };

  // Handler: Submit New Maintenance Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !order.id) return;

    setSubmittingTask(true);
    try {
      await addDoc(collection(db, "orders", order.id, "maintenance_tasks"), {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        category: taskCategory,
        priority: taskPriority,
        status: "investigating",
        createdAt: new Date().toISOString(),
        createdBy: currentUserId,
        createdByName: currentUserName,
      });

      // Notification for assigned developer / admin (No emojis)
      const targetDevId = order.maintenanceAssignedDevId || order.assignedDeveloperId;
      if (targetDevId) {
        await addDoc(collection(db, "notifications"), {
          title: `New Maintenance Task: ${taskTitle.trim()}`,
          message: `${currentUserName} submitted a new maintenance ticket for "${order.planName || "Website"}". Priority: ${taskPriority.toUpperCase()}.`,
          actionLink: "/dashboard/workspace",
          actionText: "Open Maintenance Desk",
          targetType: "user",
          targetUserId: targetDevId,
          targetEmail: order.maintenanceAssignedDevEmail || null,
          senderName: currentUserName,
          senderRole: "Client",
          createdAt: new Date().toISOString(),
          readBy: [],
          clearedBy: [],
        });
      }

      setTaskTitle("");
      setTaskDescription("");
      setTaskCategory("bug_fix");
      setTaskPriority("medium");
      setIsNewTaskModalOpen(false);
    } catch (err) {
      console.error("Failed to create maintenance task:", err);
      alert("Failed to submit task ticket.");
    } finally {
      setSubmittingTask(false);
    }
  };

  // Handler: Update Task Status (Dev / Admin)
  const handleUpdateTaskStatus = async (taskId: string, newStatus: MaintenanceTask["status"]) => {
    try {
      const updatePayload: Record<string, any> = {
        status: newStatus,
      };
      if (newStatus === "resolved") {
        updatePayload.resolvedAt = new Date().toISOString();
      }

      await updateDoc(doc(db, "orders", order.id, "maintenance_tasks", taskId), updatePayload);

      // Notify client if resolved (No emojis)
      if (newStatus === "resolved" && order.userId) {
        await addDoc(collection(db, "notifications"), {
          title: "Maintenance Task Resolved",
          message: `Your maintenance ticket on "${order.planName || "Website"}" has been marked as resolved by your dedicated engineer.`,
          actionLink: "/dashboard/workspace",
          actionText: "View Resolution",
          targetType: "user",
          targetUserId: order.userId,
          targetEmail: order.userEmail || null,
          senderName: currentUserName,
          senderRole: currentUserRole === "developer" ? "Maintenance Engineer" : "Admin",
          createdAt: new Date().toISOString(),
          readBy: [],
          clearedBy: [],
        });
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
      alert("Failed to update status.");
    }
  };

  const pendingCount = tasks.filter((t) => t.status !== "resolved").length;
  const resolvedCount = tasks.filter((t) => t.status === "resolved").length;

  return (
    <div className="space-y-4">
      {/* ── Header / Coverage Overview (Client Only) ── */}
      {currentUserRole === "client" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-black border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white">Website Maintenance & Support Desk</h4>
                {isMaintenanceActive ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ACTIVE ({daysRemaining}d left)
                  </span>
                ) : (
                  <span className="text-[10px] bg-zinc-500/20 text-zinc-400 border border-white/10 px-2 py-0.5 rounded-full font-mono font-semibold">
                    INACTIVE
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-400 mt-1">
                {isMaintenanceActive ? (
                  <>
                    Assigned Engineer: <strong className="text-white">{order.maintenanceAssignedDevName || "Lead Engineer"}</strong> • Active Support Coverage
                  </>
                ) : (
                  "Subscribe to ongoing coverage for 24/7 monitoring, security updates, and priority developer bug fixes."
                )}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            {isMaintenanceActive ? (
              <Button
                onClick={() => setIsNewTaskModalOpen(true)}
                variant="accent"
                size="sm"
                className="text-xs rounded-xl flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 font-bold shadow-md"
              >
                <Plus className="w-3.5 h-3.5" /> Submit Task Ticket
              </Button>
            ) : onInitiateCheckout ? (
              <Button
                onClick={() => setIsRetainerModalOpen(true)}
                variant="accent"
                size="sm"
                className="text-xs rounded-xl flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 font-bold shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" /> Activate Retainer (₹1,999/mo)
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Active Tasks Queue ── */}
      {isMaintenanceActive && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              Maintenance Tasks ({pendingCount} Pending • {resolvedCount} Resolved)
            </span>
            {tasks.length > 0 && currentUserRole === "client" && (
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                + Add Task
              </button>
            )}
          </div>

          {loadingTasks ? (
            <div className="p-6 text-center text-xs text-zinc-500">Loading maintenance queue...</div>
          ) : tasks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
              <p className="text-xs font-semibold text-white">
                {currentUserRole === "client" ? "All Systems Optimal & Healthy" : "All Systems Operational — Queue Clear"}
              </p>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                {currentUserRole === "client"
                  ? 'No active maintenance tickets pending. Click "+ Submit Task Ticket" whenever you need bug fixes, copy edits, or feature updates.'
                  : "No pending maintenance tickets in queue. When the client submits an issue or request, it will appear here for you to work on."}
              </p>
              {currentUserRole === "client" && (
                <Button
                  onClick={() => setIsNewTaskModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-xl mt-2"
                >
                  <Plus className="w-3 h-3 mr-1" /> Create First Task Ticket
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => {
                const cat = CATEGORY_LABELS[task.category] || CATEGORY_LABELS.other;
                const prio = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.medium;
                const st = STATUS_LABELS[task.status] || STATUS_LABELS.investigating;
                const StatusIcon = st.icon;

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      task.status === "resolved"
                        ? "bg-zinc-950/40 border-white/5 opacity-60"
                        : "bg-black/40 border-white/10 hover:border-purple-500/30"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${cat.color}`}>
                            {cat.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${prio.color}`}>
                            {prio.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 ${st.color}`}>
                            <StatusIcon className="w-3 h-3" /> {st.label}
                          </span>
                        </div>

                        <h5 className="text-sm font-bold text-white leading-snug">{task.title}</h5>

                        {task.description && (
                          <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 pt-1">
                          <span>Submitted by {task.createdByName}</span>
                          <span>•</span>
                          <span>
                            {new Date(task.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {task.resolvedAt && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-medium">
                                Resolved {new Date(task.resolvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status changer for developer & admin */}
                      {(currentUserRole === "developer" || currentUserRole === "admin") && (
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                          {task.status !== "investigating" && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, "investigating")}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                            >
                              Investigate
                            </button>
                          )}
                          {task.status !== "in_progress" && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer"
                            >
                              Start Working
                            </button>
                          )}
                          {task.status !== "resolved" && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, "resolved")}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer font-bold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Mark Resolved
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Maintenance Communication Room (Subcollection: orders/{orderId}/maintenance_messages) ── */}
      {isMaintenanceActive && (
        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Direct Maintenance Engineering Channel
              </h4>
            </div>
            <span className="text-[10px] text-zinc-500">Dedicated Maintenance Subcollection</span>
          </div>

          <DeveloperInteractionRoom
            orderId={order.id}
            orderStatus={order.status}
            planName={order.planName}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserRole={currentUserRole}
            channel="maintenance"
          />
        </div>
      )}

      {/* ── Retainer Activation & Promo Code Modal (Client Only) ── */}
      <AnimatePresence>
        {isRetainerModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              onClick={() => setIsRetainerModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-[#111] border border-purple-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl my-8">
                <button
                  onClick={() => setIsRetainerModalOpen(false)}
                  className="absolute top-5 right-5 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Website Maintenance Retainer</h3>
                    <p className="text-xs text-zinc-500">30-Day continuous SLA coverage & dedicated engineer</p>
                  </div>
                </div>

                {/* Retainer Coverage Benefits */}
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-2 mb-5">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">Coverage Includes:</span>
                  <div className="grid grid-cols-1 gap-1.5 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Dedicated Lead Maintenance Engineer assignment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Priority bug fixes, copy updates, and layout tweaks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>24/7 uptime monitoring & automated health checks</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown Banner */}
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 mb-5 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-zinc-400">Monthly Retainer Fee</span>
                    <div className="text-right">
                      {appliedMaintCoupon && (
                        <span className="text-sm line-through text-zinc-500 mr-2 font-mono">
                          ₹{BASE_RETAINER_PRICE.toLocaleString()}
                        </span>
                      )}
                      <span className="text-2xl font-black text-white">
                        ₹{(appliedMaintCoupon ? appliedMaintCoupon.finalPrice : BASE_RETAINER_PRICE).toLocaleString()}
                      </span>
                      <span className="text-xs text-zinc-500 ml-1">/ 30 Days</span>
                    </div>
                  </div>

                  {appliedMaintCoupon && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-emerald-300">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Tag className="w-3.5 h-3.5" /> Promo Discount ({appliedMaintCoupon.code}):
                      </span>
                      <span className="font-mono font-bold">−₹{appliedMaintCoupon.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Promo Code Input */}
                <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-purple-400" /> Have a Maintenance Promo Code?
                    </label>
                    {appliedMaintCoupon && (
                      <button
                        type="button"
                        onClick={handleRemoveMaintCoupon}
                        className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Remove Promo Code ✕
                      </button>
                    )}
                  </div>

                  {!appliedMaintCoupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={maintCouponInput}
                        onChange={(e) => setMaintCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyMaintCoupon();
                          }
                        }}
                        placeholder="Enter code (e.g. MAINT50)"
                        className="flex-1 bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono font-bold uppercase text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyMaintCoupon}
                        disabled={maintCouponLoading || !maintCouponInput.trim()}
                        variant="accent"
                        size="sm"
                        className="rounded-xl px-4 text-xs font-bold bg-purple-600 hover:bg-purple-700 h-9 shrink-0"
                      >
                        {maintCouponLoading ? "Checking..." : "Apply"}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white font-mono">{appliedMaintCoupon.code}</span>
                          <span className="text-[11px] text-emerald-300 ml-2">
                            ({appliedMaintCoupon.type === "percentage" ? `${appliedMaintCoupon.value}% OFF` : `₹${appliedMaintCoupon.value.toLocaleString()} OFF`} applied!)
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-emerald-300">
                        −₹{appliedMaintCoupon.discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {maintCouponError && (
                    <div className="text-[11px] text-red-400 flex items-center gap-1.5 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{maintCouponError}</span>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <Button
                    type="button"
                    onClick={() => setIsRetainerModalOpen(false)}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const finalAmount = appliedMaintCoupon ? appliedMaintCoupon.finalPrice : BASE_RETAINER_PRICE;
                      setIsRetainerModalOpen(false);
                      if (onInitiateCheckout) {
                        onInitiateCheckout(finalAmount, appliedMaintCoupon?.code);
                      }
                    }}
                    variant="accent"
                    size="sm"
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 font-bold px-5 h-10 flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Proceed to Pay ₹{(appliedMaintCoupon ? appliedMaintCoupon.finalPrice : BASE_RETAINER_PRICE).toLocaleString()}
                    </span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Submit Maintenance Task Modal ── */}
      <AnimatePresence>
        {isNewTaskModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              onClick={() => setIsNewTaskModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-[#111] border border-purple-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl my-8">
                <button
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="absolute top-5 right-5 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Create Maintenance Task</h3>
                    <p className="text-xs text-zinc-500">Submit an issue, copy edit, or feature tweak to your engineer</p>
                  </div>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Task Title <span className="text-purple-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Fix checkout button alignment on mobile devices"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Category
                      </label>
                      <select
                        value={taskCategory}
                        onChange={(e) => setTaskCategory(e.target.value as any)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        <option value="bug_fix">Bug Fix / Error Resolution</option>
                        <option value="content_update">Content / Asset Update</option>
                        <option value="performance">Speed & SEO Tuning</option>
                        <option value="feature_tweak">Feature & Layout Tweak</option>
                        <option value="other">General Maintenance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                        Priority Level
                      </label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as any)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        <option value="low">Low (Standard SLA)</option>
                        <option value="medium">Medium (Next 24–48 hrs)</option>
                        <option value="urgent">Urgent Priority (Same-day SLA)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Detailed Instructions / Asset Links
                    </label>
                    <textarea
                      rows={3}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="Describe what changes are needed, link to Google Docs/Figma/Drive if applicable..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={() => setIsNewTaskModalOpen(false)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submittingTask || !taskTitle.trim()}
                      variant="accent"
                      size="sm"
                      className="rounded-xl text-xs bg-purple-600 hover:bg-purple-700 font-bold flex items-center gap-1.5"
                    >
                      {submittingTask ? "Submitting..." : "Submit Task to Engineer"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
