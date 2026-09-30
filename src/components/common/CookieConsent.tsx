"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import Link from "next/link";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
}

export function openCookieSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-cookie-settings"));
  }
}

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    functional: true,
  });

  useEffect(() => {
    const checkConsent = () => {
      try {
        const saved = localStorage.getItem("runix_cookie_consent");
        if (!saved) {
          setIsOpen(true);
        }
      } catch {
        // Storage access handled gracefully
      }
    };

    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        const idleId = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(checkConsent, { timeout: 2500 });
        return () => {
          if ("cancelIdleCallback" in window) {
            (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
          }
        };
      } else {
        const timer = setTimeout(checkConsent, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setShowPreferences(true);
      setIsOpen(true);
    };
    window.addEventListener("open-cookie-settings", handleOpen);
    return () => window.removeEventListener("open-cookie-settings", handleOpen);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      "runix_cookie_consent",
      JSON.stringify({ essential: true, analytics: true, functional: true, timestamp: Date.now() })
    );
    setIsOpen(false);
    setShowPreferences(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem(
      "runix_cookie_consent",
      JSON.stringify({ essential: true, analytics: false, functional: false, timestamp: Date.now() })
    );
    setIsOpen(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(
      "runix_cookie_consent",
      JSON.stringify({ ...prefs, essential: true, timestamp: Date.now() })
    );
    setIsOpen(false);
    setShowPreferences(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-5 left-5 right-5 sm:left-auto sm:right-6 sm:max-w-md z-50">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
          className="bg-white border border-[rgba(17,19,23,0.10)] rounded-xl p-5 shadow-[0_8px_30px_rgba(17,19,23,0.08)] text-[#111317]"
        >
          {!showPreferences ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[14px] font-semibold tracking-tight text-[#111317]">
                    Privacy & Cookies
                  </h3>
                  <p className="text-[13px] text-[#4E5661] mt-1.5 leading-relaxed">
                    We use cookies to ensure proper website functionality and understand site traffic. We never sell your personal data. Read our{" "}
                    <Link href="/privacy" className="text-[#315EF7] hover:underline font-medium">
                      Privacy Policy
                    </Link>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-[#4B5563] hover:text-[#111317] p-1 transition-colors cursor-pointer"
                  aria-label="Dismiss cookie notice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="h-8 px-3.5 rounded-[8px] bg-[#111317] hover:bg-[#1C1F26] text-white text-[12px] font-medium transition-colors cursor-pointer"
                >
                  Accept All
                </button>
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  className="h-8 px-3 rounded-[8px] bg-[#F1F2F4] hover:bg-[#E8EAED] text-[#111317] text-[12px] font-medium transition-colors cursor-pointer"
                >
                  Reject Non-Essential
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  className="text-[12px] text-[#4B5563] hover:text-[#111317] ml-auto transition-colors cursor-pointer underline-offset-2 hover:underline"
                >
                  Preferences
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(17,19,23,0.06)] pb-2.5">
                <h3 className="text-[14px] font-semibold text-[#111317]">Cookie Preferences</h3>
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="text-[#4B5563] hover:text-[#111317] p-1 cursor-pointer"
                  aria-label="Close cookie preferences"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="font-medium text-[#111317]">Strictly Necessary</p>
                    <p className="text-[11px] text-[#7B838E]">Core security, staging sessions & tokens.</p>
                  </div>
                  <span className="text-[11px] font-mono text-[#7B838E] bg-[#F1F2F4] px-2 py-0.5 rounded">Always active</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="font-medium text-[#111317]">Analytics & Performance</p>
                    <p className="text-[11px] text-[#7B838E]">Aggregated page view & error telemetry.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.analytics}
                    onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                    className="w-4 h-4 accent-[#111317] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="font-medium text-[#111317]">Functional Preferences</p>
                    <p className="text-[11px] text-[#7B838E]">Currency selection & workspace state.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.functional}
                    onChange={(e) => setPrefs({ ...prefs, functional: e.target.checked })}
                    className="w-4 h-4 accent-[#111317] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[rgba(17,19,23,0.06)]">
                <button
                  onClick={handleRejectNonEssential}
                  className="text-[12px] text-[#7B838E] hover:text-[#111317] cursor-pointer"
                >
                  Reject All
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="h-8 px-3.5 rounded-[8px] bg-[#111317] hover:bg-[#1C1F26] text-white text-[12px] font-medium transition-colors cursor-pointer"
                >
                  Save Choices
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
