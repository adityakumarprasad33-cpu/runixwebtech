"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Globe,
  Code2,
  Download,
  MessageSquare,
  Lock,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Order {
  id: string;
  planName: string;
  planId?: string;
  price?: number;
  totalPrice?: number;
  advancePrice?: number;
  finalPrice?: number;
  advancePaid?: boolean;
  finalPaid?: boolean;
  currency?: string;
  status: string;
  stagingUrl?: string;
  demoUrl?: string;
  handoverLinks?: {
    githubRepo?: string | null;
    liveUrl?: string | null;
    driveZip?: string | null;
  };
  handoverNotes?: string | null;
  utrNumber?: string | null;
  finalUtrNumber?: string | null;
  paymentMethod?: string;
  finalPaymentMethod?: string;
  formData?: {
    company?: string;
    timeline?: string;
    projectType?: string;
    details?: string;
  };
  createdAt: any;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  awaiting_advance: { label: "Awaiting 50% Advance", color: "text-[#315EF7] bg-[#315EF7]/10 border-[#315EF7]/20", icon: Clock },
  pending_payment: { label: "Pending Payment", color: "text-[#B77900] bg-[#B77900]/10 border-[#B77900]/20", icon: Clock },
  awaiting_verification: { label: "Awaiting UTR Verification", color: "text-[#B77900] bg-[#B77900]/15 border-[#B77900]/25", icon: Clock },
  in_progress: { label: "Active Build Sprint", color: "text-[#315EF7] bg-[#315EF7]/10 border-[#315EF7]/20", icon: FolderKanban },
  testing: { label: "Quality Assurance & Testing", color: "text-[#B77900] bg-[#B77900]/10 border-[#B77900]/20", icon: FolderKanban },
  staging_deployed: { label: "Staging Demo Ready", color: "text-[#111317] bg-[#E5E7EB] border-[rgba(21,24,29,0.16)]", icon: Globe },
  awaiting_final_payment: { label: "Staging Ready • Final 50% Due", color: "text-[#B77900] bg-[#B77900]/15 border-[#B77900]/30", icon: Clock },
  completed: { label: "Completed & Handed Over", color: "text-[#169B62] bg-[#169B62]/10 border-[#169B62]/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-[#D83A3A] bg-[#D83A3A]/10 border-[#D83A3A]/20", icon: AlertCircle },
  rejected: { label: "Rejected", color: "text-[#D83A3A] bg-[#D83A3A]/10 border-[#D83A3A]/20", icon: AlertCircle },
};

function formatOrderDate(createdAt: any): string {
  if (!createdAt) return "Recent";
  try {
    if (createdAt._seconds) {
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(createdAt._seconds * 1000));
    }
    if (createdAt.seconds) {
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(createdAt.seconds * 1000));
    }
    if (typeof createdAt === "string") {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(d);
      }
    }
    if (createdAt?.toDate) {
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(createdAt.toDate());
    }
  } catch {}
  return "Recent";
}

function normalizeUrl(url?: string): string {
  if (!url) return "";
  let clean = url.trim();
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = `https://${clean}`;
  }
  return clean;
}

export default function ProjectsPage() {
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
        console.error("Realtime projects listener error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, isDeveloper, router]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111317]  tracking-tight">
            My Projects & Handover Assets
          </h1>
          <p className="text-[#4B5563] text-sm mt-1">
            Track all active build sprints, preview live staging demos, and access released GitHub codebases.
          </p>
        </div>

        <Link href="/pricing">
          <Button variant="accent" size="sm" className="rounded-xl flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-4 h-4" /> Start New Build
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-[3px] border-[rgba(21,24,29,0.10)] border-t-[#315EF7] rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[rgba(21,24,29,0.10)] rounded-xl p-16 text-center space-y-4 shadow-[0_12px_40px_rgba(21,24,29,0.06)]"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#315EF7]/10 text-[#315EF7] flex items-center justify-center mx-auto">
            <FolderKanban className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111317]">No projects booked yet</h3>
            <p className="text-[#6B7280] text-xs sm:text-sm max-w-md mx-auto mt-1">
              Choose your package with transparent 50/50 milestones and kick off your custom sprint today.
            </p>
          </div>
          <Link href="/pricing" className="inline-block pt-2">
            <Button variant="accent" size="sm" className="rounded-xl">
              Explore Packages & Pricing
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, i) => {
            const config = statusConfig[order.status] || statusConfig.pending_payment;
            const StatusIcon = config.icon;

            const totalAmount = order.totalPrice || order.price || 0;
            const advanceAmount = order.advancePrice || Math.round(totalAmount * 0.5);
            const finalAmount = order.finalPrice || (totalAmount - advanceAmount);

            const isAdvancePaid = order.advancePaid || order.status === "in_progress" || order.status === "testing" || order.status === "staging_deployed" || order.status === "awaiting_final_payment" || order.status === "completed";
            const isFinalPaid = order.finalPaid || order.status === "completed";
            const isCompleted = order.status === "completed";
            const hasStaging = !!(order.stagingUrl || order.demoUrl);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-[rgba(21,24,29,0.10)] rounded-xl p-6 sm:p-8 space-y-6 hover:border-[rgba(21,24,29,0.16)] transition-all shadow-[0_12px_40px_rgba(21,24,29,0.06)]"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(21,24,29,0.08)]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F1F2F4] border border-[rgba(21,24,29,0.08)] flex items-center justify-center shrink-0 text-[#111317]">
                      <FolderKanban className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-bold text-[#111317] tracking-tight">
                          {order.planName}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] mt-1">
                        Booked: <span className="text-[#111317] font-medium">{formatOrderDate(order.createdAt)}</span>
                        {order.formData?.company ? ` · Company: ${order.formData.company}` : ""}
                        {order.formData?.timeline ? ` · Timeline: ${order.formData.timeline}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xl sm:text-2xl font-black text-[#111317]">
                      ₹{totalAmount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">Fixed Milestone Pricing</p>
                  </div>
                </div>

                {/* 50/50 Payment Breakdown Chips */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`text-xs px-3 py-1.5 rounded-xl font-mono border flex items-center gap-1.5 ${
                      isAdvancePaid
                        ? "bg-[#169B62]/10 text-[#169B62] border-[#169B62]/20 font-bold"
                        : "bg-[#315EF7]/10 text-[#315EF7] border-[#315EF7]/20"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Advance (50%): ₹{advanceAmount.toLocaleString()} {isAdvancePaid ? "✓ Paid" : "• Due"}
                  </span>

                  <span
                    className={`text-xs px-3 py-1.5 rounded-xl font-mono border flex items-center gap-1.5 ${
                      isFinalPaid
                        ? "bg-[#169B62]/10 text-[#169B62] border-[#169B62]/20 font-bold"
                        : "bg-[#B77900]/10 text-[#B77900] border-[#B77900]/20"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Final (50%): ₹{finalAmount.toLocaleString()} {isFinalPaid ? "✓ Settled" : "• Due at Handover"}
                  </span>

                  {order.utrNumber && (
                    <span className="text-xs px-3 py-1.5 rounded-xl font-mono bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] text-[#4B5563]">
                      UTR Ref: {order.utrNumber}
                    </span>
                  )}
                </div>

                {/* Staging & Handover Assets Section */}
                <div className="space-y-3">
                  {/* Case A: Project Completed & Handover Assets Unlocked */}
                  {isCompleted ? (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#169B62]/5 border border-[#169B62]/20 space-y-3">
                      <div className="flex items-center gap-2 text-[#169B62] font-bold text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#169B62] shrink-0" />
                        <span>Project Completed — Handover Assets & Source Code Unlocked!</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {order.handoverLinks?.liveUrl && (
                          <a
                            href={order.handoverLinks.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#111317] hover:bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] transition-colors font-medium shadow-xs"
                          >
                            <Globe className="w-4 h-4 text-[#315EF7]" /> Live Production URL ↗
                          </a>
                        )}
                        {order.handoverLinks?.githubRepo && (
                          <a
                            href={order.handoverLinks.githubRepo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#111317] hover:bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] transition-colors font-medium shadow-xs"
                          >
                            <Code2 className="w-4 h-4 text-[#111317]" /> GitHub Repository ↗
                          </a>
                        )}
                        {order.handoverLinks?.driveZip && (
                          <a
                            href={order.handoverLinks.driveZip}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#111317] hover:bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] transition-colors font-medium shadow-xs"
                          >
                            <Download className="w-4 h-4 text-[#111317]" /> Download Codebase (.zip) ↗
                          </a>
                        )}
                      </div>

                      {order.handoverNotes && (
                        <div className="p-3.5 bg-[#FAFAFA] rounded-xl border border-[rgba(21,24,29,0.08)] text-xs text-[#4B5563] space-y-1">
                          <span className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider block">
                            Deployment Notes & Admin Credentials:
                          </span>
                          <p className="whitespace-pre-wrap leading-relaxed text-[#111317]">{order.handoverNotes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Case B: Work in Progress or Staging Ready (Assets Locked until Final Settlement) */
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#111317]">
                          <Lock className="w-4 h-4 text-[#6B7280] shrink-0" />
                          <span>Code Repository & Handover Assets (Locked)</span>
                        </div>

                        {hasStaging && (
                          <Link
                            href={`/preview?url=${encodeURIComponent(normalizeUrl(order.stagingUrl || order.demoUrl || ""))}&title=${encodeURIComponent(order.planName || "Staging Preview")}&ref=/dashboard/projects`}
                            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-[#315EF7] hover:bg-[#2A50D4] text-white flex items-center gap-1.5 transition-all shadow-sm w-fit"
                          >
                            <Globe className="w-3.5 h-3.5" /> Launch Staging Preview ↗
                          </Link>
                        )}
                      </div>

                      <p className="text-xs text-[#4B5563] leading-relaxed">
                        {hasStaging
                          ? "Your live staging demo is deployed and ready for client review above! Complete the final 50% milestone settlement to automatically unlock full GitHub repository ownership, source code zip, and production deployment keys."
                          : "Your project is actively being developed. Once the sprint is ready, your staging demo URL will be available here for review before settling the final 50% milestone."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(21,24,29,0.08)]">
                  <div className="flex items-center gap-2">
                    <Link href="/dashboard/workspace">
                      <Button variant="outline" size="sm" className="rounded-xl text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#315EF7]" /> Open Project Workspace
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isAdvancePaid && (
                      <Link href="/dashboard">
                        <Button variant="accent" size="sm" className="rounded-xl text-xs">
                          Settle Advance (₹{advanceAmount.toLocaleString()})
                        </Button>
                      </Link>
                    )}

                    {isAdvancePaid && !isFinalPaid && order.status === "awaiting_final_payment" && (
                      <Link href="/dashboard">
                        <Button variant="accent" size="sm" className="rounded-xl text-xs bg-[#B77900] hover:bg-[#966300] text-white font-bold">
                          Settle Final (₹{finalAmount.toLocaleString()})
                        </Button>
                      </Link>
                    )}
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
