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

interface Message {
  id: string;
  senderId: string;
  senderRole: "admin" | "user";
  senderName: string;
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
  currentUserRole: "admin" | "user";
}

const LOCKED_STATUSES = ["pending_payment", "awaiting_verification", "pending", "rejected"];

const LINK_TYPE_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  preview: { icon: Eye, label: "Live Preview", color: "text-emerald-400" },
  figma: { icon: Link2, label: "Figma Design", color: "text-purple-400" },
  github: { icon: GitBranch, label: "GitHub Repo", color: "text-zinc-300" },
  file: { icon: Package, label: "Files / Assets", color: "text-amber-400" },
  general: { icon: Link2, label: "Link", color: "text-indigo-400" },
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
}: DeveloperInteractionRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkType, setLinkType] = useState<Message["linkType"]>("general");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLocked = LOCKED_STATUSES.includes(orderStatus);

  useEffect(() => {
    if (isLocked) return;
    const q = query(
      collection(db, "orders", orderId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))
      );
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return () => unsub();
  }, [orderId, isLocked]);

  const handleSend = async () => {
    const msg = text.trim();
    const url = linkUrl.trim();
    if (!msg && !url) return;
    setSending(true);
    try {
      await addDoc(collection(db, "orders", orderId, "messages"), {
        senderId: currentUserId,
        senderRole: currentUserRole,
        senderName: currentUserName,
        text: msg || null,
        linkUrl: url || null,
        linkType: url ? linkType : null,
        createdAt: new Date().toISOString(),
      });
      setText("");
      setLinkUrl("");
      setShowLinkInput(false);
    } catch (e) {
      console.error("Failed to send message:", e);
      alert("Failed to send message");
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
      <div className="mt-4 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
          <Lock className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-300">
            Developer Interaction Room — Locked
          </p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            This workspace unlocks automatically once your payment is{" "}
            <span className="text-amber-400 font-medium">confirmed by our team</span>. You will receive a notification when it's ready.
          </p>
          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Status: {orderStatus.replace(/_/g, " ")}
          </span>
        </div>
      </div>
    );
  }

  // ── Unlocked State ──
  return (
    <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-white/[0.01] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-indigo-500/[0.03]">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs font-bold text-white">Developer Workspace</p>
          <span className="text-[10px] text-zinc-500 font-medium">— {planName}</span>
        </div>
        {/* Admin Quick Buttons */}
        {currentUserRole === "admin" && (
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
                  className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 hover:border-white/20 transition-colors ${meta.color} bg-white/[0.03] hover:bg-white/[0.06]`}
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
          <div className="h-full flex items-center justify-center text-xs text-zinc-600">
            No messages yet. Start the conversation!
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
                      ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-100"
                      : "bg-white/[0.05] border border-white/10 text-zinc-200"
                  }`}
                >
                  {m.text && <p className="leading-relaxed">{m.text}</p>}
                  {m.linkUrl && (
                    <div className="mt-1.5 flex items-center gap-2 p-2 bg-black/30 rounded-xl border border-white/10">
                      {(() => {
                        const meta = LINK_TYPE_META[m.linkType || "general"];
                        const Icon = meta.icon;
                        return (
                          <>
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                            <span className={`text-xs font-medium ${meta.color}`}>
                              {meta.label}:
                            </span>
                            <a
                              href={m.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex-1 truncate"
                            >
                              {m.linkUrl}
                            </a>
                            <button
                              onClick={() => copyToClipboard(m.linkUrl!)}
                              className="text-zinc-500 hover:text-white transition-colors shrink-0"
                            >
                              {copied === m.linkUrl ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={m.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-white transition-colors shrink-0"
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
                      m.senderRole === "admin" ? "text-indigo-400" : "text-emerald-400"
                    }`}
                  >
                    {m.senderRole === "admin" ? "Dev Team" : m.senderName}
                  </span>
                  <span className="text-[10px] text-zinc-600">•</span>
                  <span className="text-[10px] text-zinc-600">
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
        {showLinkInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3"
          >
            <div className="flex items-center gap-2 p-2 bg-[#0e0e0e] rounded-xl border border-white/10">
              <span className={`text-[11px] font-bold shrink-0 ${LINK_TYPE_META[linkType!].color}`}>
                {LINK_TYPE_META[linkType!].label}:
              </span>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Paste URL..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
              />
              <button
                onClick={() => { setShowLinkInput(false); setLinkUrl(""); }}
                className="text-zinc-500 hover:text-white text-xs px-2"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-[#0e0e0e] border border-white/10 rounded-xl p-2">
          <button
            onClick={() => setShowLinkInput(!showLinkInput)}
            title="Share a link"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || (!text.trim() && !linkUrl.trim())}
            className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-700 mt-1.5 px-1">
          Press Enter to send · Use the link icon to share files, previews & designs
        </p>
      </div>
    </div>
  );
}
