"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Send,
  Link2,
  ExternalLink,
  Copy,
  GitBranch,
  Eye,
  Package,
  CheckCheck,
} from "lucide-react";
import { normalizeUrl } from "@/lib/safeFetch";

interface Message {
  id: string;
  senderId: string;
  senderRole: "admin" | "user" | "developer" | "client";
  senderName: string;
  senderDesignation?: string | null;
  senderDepartment?: string | null;
  text?: string;
  linkUrl?: string;
  linkType?: "preview" | "figma" | "github" | "file" | "general";
  createdAt: string;
}

interface DeveloperInteractionRoomProps {
  orderId: string;
  orderStatus: string;
  planName: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: "admin" | "user" | "developer" | "client";
  currentUserDesignation?: string;
  currentUserDepartment?: string;
  channel?: "sprint" | "maintenance";
  customTitle?: string;
  isReadOnly?: boolean;
}

const LOCKED_STATUSES = ["pending_payment", "awaiting_verification", "pending", "rejected"];

const LINK_TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  preview: { icon: Eye, label: "Live Preview", color: "text-[#169B62]" },
  figma: { icon: Link2, label: "Figma Design", color: "text-[#315EF7]" },
  github: { icon: GitBranch, label: "GitHub Repo", color: "text-[#111317]" },
  file: { icon: Package, label: "Files / Assets", color: "text-[#B77900]" },
  general: { icon: Link2, label: "Link", color: "text-[#315EF7]" },
};

function formatRelativeTime(iso: string): string {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function DeveloperInteractionRoom({
  orderId,
  orderStatus,
  planName,
  currentUserId,
  currentUserName,
  currentUserRole,
  currentUserDesignation,
  currentUserDepartment,
  channel = "sprint",
  customTitle,
  isReadOnly,
}: DeveloperInteractionRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkType, setLinkType] = useState<Message["linkType"]>("general");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isLocked = channel === "sprint" && LOCKED_STATUSES.includes(orderStatus);
  const isSprintCompletedReadOnly = (channel === "sprint" && orderStatus === "completed") || isReadOnly;
  const messagesCollectionName = channel === "maintenance" ? "maintenance_messages" : "messages";

  useEffect(() => {
    if (isLocked || !orderId) return;

    const q = query(
      collection(db, "orders", orderId, messagesCollectionName),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))
        );
      },
      (err) => {
        console.error("Realtime chat error:", err);
      }
    );

    return () => unsub();
  }, [orderId, isLocked, messagesCollectionName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if ((!text.trim() && !linkUrl.trim()) || sending || isLocked || isSprintCompletedReadOnly) return;
    setSending(true);

    try {
      const payload: Omit<Message, "id"> = {
        senderId: currentUserId,
        senderRole: currentUserRole,
        senderName: currentUserName,
        senderDesignation: currentUserDesignation || null,
        senderDepartment: currentUserDepartment || null,
        text: text.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        linkType: linkUrl.trim() ? linkType : undefined,
        createdAt: new Date().toISOString(),
      };

      await addDoc(
        collection(db, "orders", orderId, messagesCollectionName),
        payload
      );

      setText("");
      setLinkUrl("");
      setShowLinkInput(false);
    } catch (err: any) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  };

  // ── Locked State ──
  if (isLocked) {
    return (
      <div className="mt-4 p-5 rounded-2xl border border-[#B77900]/20 bg-[#B77900]/5 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-[#B77900]/10 shrink-0">
          <Lock className="w-4 h-4 text-[#B77900]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#111317]">
            Developer Interaction Room — Locked
          </p>
          <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
            This workspace unlocks automatically once your payment is{" "}
            <span className="text-[#B77900] font-medium">confirmed by our team</span>. You will receive a notification when it's ready.
          </p>
          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B77900]/10 text-[#B77900] border border-[#B77900]/20">
            Status: {orderStatus.replace(/_/g, " ")}
          </span>
        </div>
      </div>
    );
  }

  // ── Unlocked State ──
  const isMaintenanceChannel = channel === "maintenance";

  return (
    <div className="mt-4 rounded-2xl border border-[rgba(21,24,29,0.10)] bg-[#FAFAFA] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(21,24,29,0.08)] bg-white">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${isSprintCompletedReadOnly ? "bg-[#6B7280]" : isMaintenanceChannel ? "bg-[#315EF7] animate-pulse" : "bg-[#169B62] animate-pulse"}`} />
          <p className="text-xs font-bold text-[#111317]">
            {customTitle || (isMaintenanceChannel ? "🛠️ Maintenance & SLA Support Channel" : isSprintCompletedReadOnly ? "Project Sprint Room (Completed Archive)" : "Developer Workspace")}
          </p>
          <span className="text-[10px] text-[#6B7280] font-medium">— {planName}</span>
          {isSprintCompletedReadOnly && (
            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#E5E7EB] text-[#4B5563] border border-[rgba(21,24,29,0.10)]">
              Read Only
            </span>
          )}
        </div>
        {/* Admin Quick Buttons */}
        {currentUserRole === "admin" && !isSprintCompletedReadOnly && (
          <div className="flex items-center gap-1.5">
            {(["preview", "figma", "github", "file"] as const).map((type) => {
              const meta = LINK_TYPE_META[type];
              const Icon = meta.icon;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setLinkType(type);
                    setShowLinkInput(true);
                  }}
                  title={`Share ${meta.label}`}
                  className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-lg border border-[rgba(21,24,29,0.10)] hover:border-[rgba(21,24,29,0.20)] transition-colors ${meta.color} bg-white hover:bg-[#FAFAFA]`}
                >
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-[#6B7280]">
            {isMaintenanceChannel
              ? "No maintenance messages yet. Discuss tasks, fixes, and support updates here!"
              : isSprintCompletedReadOnly
              ? "No sprint messages recorded."
              : "No messages yet. Start the conversation!"}
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.senderRole === "admin"
                      ? "bg-white border border-[#315EF7]/30 text-[#111317] shadow-xs"
                      : "bg-[#E5E7EB] border border-[rgba(21,24,29,0.08)] text-[#111317]"
                  }`}
                >
                  {m.text && <p className="leading-relaxed">{m.text}</p>}
                  {m.linkUrl && (
                    <div className="mt-1.5 flex items-center gap-2 p-2 bg-white rounded-xl border border-[rgba(21,24,29,0.10)] flex-wrap sm:flex-nowrap">
                      {(() => {
                        const meta = LINK_TYPE_META[m.linkType || "general"];
                        const Icon = meta.icon;
                        const validUrl = normalizeUrl(m.linkUrl);
                        const isStagingOrPreview = m.linkType === "preview" || validUrl.includes("preview") || validUrl.includes(".vercel.app") || validUrl.includes("runix.") || validUrl.includes("staging");
                        return (
                          <>
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                            <span className={`text-xs font-medium ${meta.color}`}>
                              {meta.label}:
                            </span>
                            <a
                              href={validUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#315EF7] hover:underline underline-offset-2 flex-1 truncate"
                            >
                              {m.linkUrl}
                            </a>
                            {isStagingOrPreview && (
                              <a
                                href={`/preview?url=${encodeURIComponent(validUrl)}&title=${encodeURIComponent(m.text || "Live Preview")}&ref=/dashboard/workspace`}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#315EF7]/10 text-[#315EF7] border border-[#315EF7]/20 hover:bg-[#315EF7]/20 transition-colors shrink-0"
                              >
                                Preview Demo
                              </a>
                            )}
                            <button
                              onClick={() => copyToClipboard(validUrl)}
                              className="text-[#6B7280] hover:text-[#111317] transition-colors shrink-0 cursor-pointer p-0.5"
                              title="Copy Link"
                            >
                              {copied === validUrl ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#169B62]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={validUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#6B7280] hover:text-[#111317] transition-colors shrink-0 p-0.5"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                {/* Footer: sender name + time */}
                <div className="flex items-center gap-1.5 px-1">
                  <span
                    className={`text-[10px] font-bold ${
                      m.senderRole === "admin"
                        ? "text-[#315EF7]"
                        : "text-[#4B5563]"
                    }`}
                  >
                    {m.senderRole === "admin" 
                      ? (m.senderDesignation ? `${m.senderName} • ${m.senderDesignation}` : (isMaintenanceChannel ? "Maintenance Engineer" : "Dev Team"))
                      : m.senderName}
                  </span>
                  <span className="text-[10px] text-[#6B7280]">•</span>
                  <span className="text-[10px] text-[#6B7280]">
                    {formatRelativeTime(m.createdAt)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Link Input (admin quick share) */}
      <AnimatePresence>
        {showLinkInput && !isSprintCompletedReadOnly && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-[rgba(21,24,29,0.10)]">
              <span className={`text-[11px] font-bold shrink-0 ${LINK_TYPE_META[linkType!].color}`}>
                {LINK_TYPE_META[linkType!].label}:
              </span>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Paste URL..."
                className="flex-1 bg-transparent text-xs text-[#111317] placeholder:text-[#6B7280] outline-none"
              />
              <button
                onClick={() => { setShowLinkInput(false); setLinkUrl(""); }}
                className="text-[#6B7280] hover:text-[#111317] text-xs px-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input or Read-Only Notice */}
      {isSprintCompletedReadOnly ? (
        <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[rgba(21,24,29,0.08)] flex items-center justify-between gap-3 text-xs text-[#4B5563]">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
            <span>Sprint build is completed & delivered. This project chat is now in <strong>read-only archive mode</strong>.</span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#E5E7EB] text-[#4B5563] border border-[rgba(21,24,29,0.10)] shrink-0">
            Archived
          </span>
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-white border border-[rgba(21,24,29,0.12)] rounded-xl p-2 shadow-xs">
            <button
              onClick={() => setShowLinkInput(!showLinkInput)}
              title="Share a link"
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#315EF7] hover:bg-[#315EF7]/10 transition-colors cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={isMaintenanceChannel ? "Message maintenance team regarding tasks or fixes..." : "Type a message..."}
              className="flex-1 bg-transparent text-sm text-[#111317] placeholder:text-[#6B7280] outline-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || (!text.trim() && !linkUrl.trim())}
              className="p-2 rounded-lg text-white bg-[#315EF7] hover:bg-[#2A50D4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1.5 px-1">
            Press Enter to send · Use the link icon to share files, previews & designs
          </p>
        </div>
      )}
    </div>
  );
}
