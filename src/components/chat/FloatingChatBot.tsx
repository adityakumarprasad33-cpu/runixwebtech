"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MessageSquare, X } from "lucide-react";
import { usePathname } from "next/navigation";

// Dynamically import the heavy chat window only when user interacts (Requirement 14)
const DynamicChatWindow = dynamic(
  () => import("./FloatingChatWindow"),
  { ssr: false }
);

export default function FloatingChatBot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoadedChunk, setHasLoadedChunk] = useState(false);

  const isAuth =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";

  if (isAuth) return null;

  const handleToggle = () => {
    setHasLoadedChunk(true);
    setIsOpen(!isOpen);
  };

  const handlePrefetch = () => {
    if (!hasLoadedChunk) {
      setHasLoadedChunk(true);
    }
  };

  return (
    <aside
      aria-label="Runix Concierge Chat"
      className="fixed bottom-6 right-6 z-50 pointer-events-auto select-none"
    >
      {/* ── Chat Window Dialog (Loaded dynamically only on interaction) ── */}
      {isOpen && hasLoadedChunk && (
        <DynamicChatWindow onClose={() => setIsOpen(false)} />
      )}

      {/* ── Quiet Floating Trigger Button ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          onMouseEnter={handlePrefetch}
          onFocus={handlePrefetch}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#111317] hover:bg-[#1C1F26] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(17,19,23,0.18)] border border-[rgba(255,255,255,0.12)] transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#315EF7]"
          aria-label={isOpen ? "Close Runix concierge chat" : "Open Runix engineering concierge chat"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white" aria-hidden="true" />
          ) : (
            <MessageSquare className="w-5 h-5 text-white" aria-hidden="true" />
          )}
        </button>
      </div>
    </aside>
  );
}
