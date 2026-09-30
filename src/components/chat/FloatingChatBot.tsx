"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronDown,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  link?: {
    href: string;
    label: string;
  };
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Welcome to Runix Web Technologies. I am your engineering & project scoping concierge. How can I assist you with your digital build today?",
    timestamp: "Just now",
  },
];

const SUGGESTIONS = [
  "💼 What are your pricing plans?",
  "🛡️ How does 50/50 payment work?",
  "⚡ What is your sprint timeline?",
  "🛠️ What tech stack do you use?",
  "📅 Start a project inquiry",
];

export default function FloatingChatBot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const isAuth =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";

  const isDashboard = pathname?.startsWith("/dashboard");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const getBotResponse = (query: string): { text: string; link?: { href: string; label: string } } => {
    const q = query.toLowerCase();

    if (q.includes("price") || q.includes("pricing") || q.includes("cost") || q.includes("plan") || q.includes("rate")) {
      return {
        text: "Our core production tiers start transparently:\n\n• Essential (₹3,999): High-converting landing pages & portfolios (3–5 days).\n• Professional (₹9,999): Full multi-page business platforms with SEO & micro-animations (7–10 days).\n• Custom Enterprise: Complex SaaS platforms, client portals, and bespoke dashboards.\n\nAll packages include our 50/50 milestone payment guarantee.",
        link: {
          href: "/pricing",
          label: "View All Pricing & Packages",
        },
      };
    }

    if (q.includes("50/50") || q.includes("payment") || q.includes("guarantee") || q.includes("advance") || q.includes("risk")) {
      return {
        text: "Our Zero-Risk 50/50 Milestone Guarantee ensures absolute transparency:\n\n1. 50% Advance to kickstart your sprint.\n2. We build and stage a private live demo URL for your testing.\n3. You only settle the remaining 50% balance after full satisfaction before code handover and production deployment.",
        link: {
          href: "/pricing",
          label: "Read Milestone Terms",
        },
      };
    }

    if (q.includes("timeline") || q.includes("time") || q.includes("delivery") || q.includes("fast") || q.includes("days")) {
      return {
        text: "We execute focused, rapid engineering sprints:\n\n• Essential Landing Pages: 3–5 business days\n• Multi-Page Platforms: 7–10 business days\n• Bespoke Web Applications: 2–3 weeks\n\nNeed urgent delivery? We also accommodate 48-hour emergency sprint launches.",
        link: {
          href: "/contact",
          label: "Inquire About Fast-Track Sprint",
        },
      };
    }

    if (q.includes("tech") || q.includes("stack") || q.includes("framework") || q.includes("code") || q.includes("next")) {
      return {
        text: "We engineer with modern, high-performance architecture:\n\n• Frontend: Next.js 16 (App Router), React 19, TypeScript\n• Styling: Tailwind CSS v4, Framer Motion\n• Backend & Data: Node.js, Firebase Firestore, PostgreSQL\n• Performance: Sub-second First Contentful Paint and 95+ Lighthouse audit guarantee.",
      };
    }

    if (q.includes("start") || q.includes("hire") || q.includes("contact") || q.includes("inquiry") || q.includes("book") || q.includes("consult")) {
      return {
        text: "We would love to engineer your platform. You can configure your project package directly on our pricing page, submit your specs in your client dashboard, or reach out to our lead team directly.",
        link: {
          href: "/contact",
          label: "Contact Engineering Team",
        },
      };
    }

    if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
      return {
        text: "Hello! How can we assist you today? Feel free to ask about our web development services, pricing tiers, milestone workflow, or project turnaround times.",
      };
    }

    return {
      text: "Thank you for reaching out. We engineer bespoke web apps, platforms, and dashboards. To discuss specific requirements, explore our packages or drop us a message anytime.",
      link: {
        href: "/pricing",
        label: "Explore Services & Pricing",
      },
    };
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(query);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: response.text,
        timestamp: "Just now",
        link: response.link,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
  };

  if (isAuth) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto select-none">
      {/* ── Chat Window Dialog ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="mb-4 w-[360px] sm:w-[400px] h-[550px] max-h-[82vh] rounded-xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.12)] shadow-[0_24px_70px_rgba(21,24,29,0.14)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[rgba(21,24,29,0.08)] bg-[#FAFAFA] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-[#111317] text-white flex items-center justify-center  font-extrabold text-sm shadow-sm">
                    R
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#169B62] border-2 border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-[#111317] ">Runix Concierge</h3>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#315EF7]/10 text-[9px] font-mono text-[#315EF7] font-semibold uppercase">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4B5563] font-medium">Project Sizing & Technical Advisory</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleReset}
                  title="Reset Conversation"
                  className="w-8 h-8 rounded-full hover:bg-[rgba(21,24,29,0.06)] flex items-center justify-center text-[#6B7280] hover:text-[#111317] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Concierge"
                  className="w-8 h-8 rounded-full hover:bg-[rgba(21,24,29,0.06)] flex items-center justify-center text-[#6B7280] hover:text-[#111317] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans bg-[#FAFAFA]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-wrap ${
                      m.sender === "user"
                        ? "bg-[#111317] text-white font-medium rounded-br-xs shadow-sm"
                        : "bg-[#FFFFFF] text-[#111317] border border-[rgba(21,24,29,0.10)] rounded-bl-xs shadow-sm"
                    }`}
                  >
                    {m.text}

                    {m.link && (
                      <div className="mt-3 pt-2.5 border-t border-[rgba(21,24,29,0.10)]">
                        <Link
                          href={m.link.href}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#315EF7] hover:text-[#2A50D4] underline underline-offset-4 transition-colors"
                        >
                          {m.link.label}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#6B7280] mt-1 px-1 font-mono">{m.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] w-fit shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4B5563] animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4B5563] animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4B5563] animate-bounce" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="px-4 py-2.5 bg-[#FFFFFF] border-t border-[rgba(21,24,29,0.08)] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {SUGGESTIONS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(item)}
                  className="px-2.5 py-1 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] border border-[rgba(21,24,29,0.08)] text-[10px] font-medium text-[#4B5563] hover:text-[#111317] whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#FFFFFF] border-t border-[rgba(21,24,29,0.08)] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-[#F1F2F4] border border-[rgba(21,24,29,0.10)] rounded-full px-3 py-1.5 focus-within:border-[#315EF7] focus-within:bg-[#FFFFFF] transition-all"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about pricing, timeline, tech stack..."
                  className="flex-1 bg-transparent text-xs text-[#111317] placeholder-[#6B7280] focus:outline-none px-1"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-7 h-7 rounded-full bg-[#111317] text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center hover:bg-[#315EF7] transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quiet Floating Trigger Button ── */}
      <div className="flex items-center gap-3">
        {/* Floating Trigger Button (Quiet, Clean, Architectural) */}
        <button
          onClick={handleOpen}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#111317] hover:bg-[#1C1F26] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(17,19,23,0.18)] border border-[rgba(255,255,255,0.12)] transition-all duration-150 cursor-pointer"
          aria-label="Toggle Runix Project Chat"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close-icon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="chat-icon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
