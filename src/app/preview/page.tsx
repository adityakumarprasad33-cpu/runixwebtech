"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Lock,
  Maximize2,
  Minimize2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Zap,
  Layers,
  Globe,
  X,
} from "lucide-react";
import { normalizeUrl } from "@/lib/safeFetch";

type DeviceMode = "desktop" | "tablet" | "mobile";

function PreviewViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawUrl = searchParams.get("url") || "";
  const title = searchParams.get("title") || "Live Staging Preview";
  const ref = searchParams.get("ref") || "/dashboard";

  const targetUrl = normalizeUrl(rawUrl);

  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState(targetUrl);
  const [activeUrl, setActiveUrl] = useState(targetUrl);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetUrl) {
      setCustomInputUrl(targetUrl);
      setActiveUrl(targetUrl);
      setIsLoading(true);
      setLoadTimedOut(false);
    }
  }, [targetUrl]);

  // Handle load timeout for sites that block embedding (X-Frame-Options)
  useEffect(() => {
    if (!activeUrl) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadTimedOut(false);

    const timer = setTimeout(() => {
      setLoadTimedOut(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [activeUrl, iframeKey]);

  const handleCopy = async () => {
    if (!activeUrl) return;
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setLoadTimedOut(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputUrl.trim()) return;
    const normalized = normalizeUrl(customInputUrl);
    setActiveUrl(normalized);
    setCustomInputUrl(normalized);
    setIsLoading(true);
    setLoadTimedOut(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F1F2F4] text-[#111317] font-sans overflow-hidden select-none">
      {/* ── Top Navigation & Command Bar ── */}
      <header className="h-16 bg-[#FFFFFF] border-b border-[rgba(21,24,29,0.10)] px-4 sm:px-6 flex items-center justify-between gap-4 z-40 shrink-0 shadow-xs">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={ref}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F1F2F4] hover:bg-[#E5E7EB] border border-[rgba(21,24,29,0.08)] text-xs font-semibold text-[#111317] transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#4B5563]" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#315EF7]/10 border border-[#315EF7]/20 flex items-center justify-center text-[#315EF7] shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-[#111317] truncate ">
                {title}
              </h1>
              <div className="flex items-center gap-1 text-[10px] text-[#4B5563] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#169B62]" />
                <span>Active Staging Engine</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Device Frame Switcher */}
        <div className="hidden md:flex items-center bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] rounded-2xl p-1 gap-1">
          <button
            onClick={() => setDevice("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              device === "desktop"
                ? "bg-[#111317] text-white shadow-sm font-bold"
                : "text-[#4B5563] hover:text-[#111317] hover:bg-white"
            }`}
            title="Desktop View (100% Fluid)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          <button
            onClick={() => setDevice("tablet")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              device === "tablet"
                ? "bg-[#111317] text-white shadow-sm font-bold"
                : "text-[#4B5563] hover:text-[#111317] hover:bg-white"
            }`}
            title="Tablet View (768px iPad Frame)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>

          <button
            onClick={() => setDevice("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              device === "mobile"
                ? "bg-[#111317] text-white shadow-sm font-bold"
                : "text-[#4B5563] hover:text-[#111317] hover:bg-white"
            }`}
            title="Mobile View (390px iPhone Frame)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          {activeUrl && (
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#315EF7] hover:bg-[#2A50D4] text-white text-xs font-bold transition-all shadow-sm"
              title="Open Live in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Live</span>
            </a>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#F1F2F4] hover:bg-[#E5E7EB] border border-[rgba(21,24,29,0.08)] text-[#4B5563] hover:text-[#111317] transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Sub-Bar: Address Bar with SSL Badge ── */}
      <div className="bg-[#FFFFFF] border-b border-[rgba(21,24,29,0.08)] px-4 sm:px-6 py-2 flex items-center justify-between gap-3 shrink-0 z-30">
        <form onSubmit={handleUrlSubmit} className="flex-1 max-w-2xl mx-auto flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] focus-within:border-[#315EF7] focus-within:bg-white rounded-xl px-3 py-1.5 transition-all">
            <Lock className="w-3.5 h-3.5 text-[#169B62] shrink-0" />
            <input
              type="text"
              value={customInputUrl}
              onChange={(e) => setCustomInputUrl(e.target.value)}
              placeholder="Enter Staging or Live Website URL..."
              className="w-full bg-transparent text-xs font-mono text-[#111317] placeholder:text-[#6B7280] focus:outline-none"
            />
            {activeUrl && (
              <span className="text-[10px] font-mono text-[#169B62] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#169B62]/10 shrink-0">
                SSL 256-Bit
              </span>
            )}
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-[#111317] text-white hover:bg-black text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            Load
          </button>
        </form>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-[#4B5563] hover:text-[#111317] hover:bg-[#F1F2F4] transition-colors cursor-pointer"
            title="Reload Iframe"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#315EF7]" : ""}`} />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-[#4B5563] hover:text-[#111317] hover:bg-[#F1F2F4] transition-colors cursor-pointer"
            title="Copy Staging URL"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#169B62]" />
                <span className="text-[#169B62]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Viewport Workspace Canvas ── */}
      <main
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#E5E7EB] overflow-auto"
      >
        {activeUrl ? (
          <div
            className={`relative flex flex-col transition-all duration-300 ease-out shadow-[0_20px_60px_rgba(21,24,29,0.12)] ${
              device === "desktop"
                ? "w-full h-full rounded-2xl border border-[rgba(21,24,29,0.12)] bg-[#FFFFFF] overflow-hidden"
                : device === "tablet"
                ? "w-[768px] h-[1024px] max-h-[85vh] rounded-xl border-[10px] border-[#242831] bg-black shadow-[0_24px_70px_rgba(21,24,29,0.20)] overflow-hidden"
                : "w-[390px] h-[844px] max-h-[88vh] rounded-[3rem] border-[10px] border-[#242831] bg-black shadow-[0_24px_70px_rgba(21,24,29,0.25)] overflow-hidden"
            }`}
          >
            {/* Mobile & Tablet Top Speaker / Dynamic Island Bezel Mockup */}
            {device === "mobile" && (
              <div className="h-6 bg-[#242831] flex items-center justify-center shrink-0">
                <div className="w-24 h-4 bg-black rounded-full flex items-center justify-between px-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#315EF7]/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-white/10" />
                </div>
              </div>
            )}
            {device === "tablet" && (
              <div className="h-4 bg-[#242831] flex items-center justify-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-zinc-900 border border-white/10" />
              </div>
            )}

            {/* Frame Viewport */}
            <div className="relative flex-1 w-full h-full bg-white overflow-hidden">
              {/* Animated Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-[#F1F2F4] flex flex-col items-center justify-center gap-4 text-center p-6">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-2 border-[#315EF7]/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-[#315EF7] border-t-transparent animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#111317] ">
                      Rendering Live Staging Environment...
                    </p>
                    <p className="text-xs text-[#6B7280] font-mono">
                      Connecting to {new URL(activeUrl).hostname}
                    </p>
                  </div>
                </div>
              )}

              <iframe
                key={iframeKey}
                src={activeUrl}
                title={title}
                onLoad={() => setIsLoading(false)}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />

              {/* Embedding Safety Fallback: Visible if iframe load timed out due to X-Frame-Options */}
              {loadTimedOut && !isNoticeDismissed && (
                <div className="absolute bottom-4 right-4 left-4 sm:left-auto max-w-sm p-4 rounded-2xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.12)] shadow-[0_16px_40px_rgba(21,24,29,0.15)] z-30 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <AlertCircle className="w-4 h-4 text-[#315EF7] shrink-0 mt-0.5" />
                      <div className="text-xs text-[#4B5563] leading-relaxed">
                        <p className="font-bold text-[#111317] mb-0.5">Live Preview Notice</p>
                        If this site restricts browser iframe embedding via security headers, you can open it in a full native window.
                      </div>
                    </div>
                    <button
                      onClick={() => setIsNoticeDismissed(true)}
                      className="p-1 rounded-lg text-[#6B7280] hover:text-[#111317] hover:bg-[#F1F2F4] transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer"
                      title="Hide Notice"
                      aria-label="Close Notice"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-[#315EF7] hover:bg-[#2A50D4] text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      Open Live Demo Window <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setIsNoticeDismissed(true)}
                      className="px-3 py-2 rounded-xl bg-[#F1F2F4] hover:bg-[#E5E7EB] text-xs text-[#111317] font-medium transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Home Bar */}
            {device === "mobile" && (
              <div className="h-4 bg-[#242831] flex items-center justify-center shrink-0">
                <div className="w-28 h-1 bg-white/20 rounded-full" />
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md p-8 rounded-xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] text-center space-y-4 shadow-[0_12px_40px_rgba(21,24,29,0.06)]">
            <div className="w-16 h-16 rounded-2xl bg-[#315EF7]/10 text-[#315EF7] flex items-center justify-center mx-auto">
              <Globe className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#111317] ">No Staging URL Specified</h2>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Please enter a valid website URL in the address bar above or open this viewer from an active order on your dashboard.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[13px] bg-[#111317] text-white text-xs font-semibold hover:bg-black transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#F1F2F4] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#315EF7] border-t-transparent animate-spin" />
        </div>
      }
    >
      <PreviewViewerContent />
    </Suspense>
  );
}
