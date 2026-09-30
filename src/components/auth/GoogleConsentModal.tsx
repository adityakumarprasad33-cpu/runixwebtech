"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface GoogleConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function GoogleConsentModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: GoogleConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Reset agreement on open/close
  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus modal container
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    } else {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Lock background scrolling while modal is open (Requirement 9)
  useEffect(() => {
    if (!isOpen) return;

    const formColumn = document.getElementById("auth-form-column");
    const previousColumnOverflow = formColumn ? formColumn.style.overflowY : "";
    const previousBodyOverflow = document.body.style.overflow;

    if (formColumn) {
      formColumn.style.overflowY = "hidden";
    }
    document.body.style.overflow = "hidden";

    return () => {
      if (formColumn) {
        formColumn.style.overflowY = previousColumnOverflow;
      }
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isOpen]);

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!isLoading) onClose();
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-consent-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => !isLoading && onClose()}
          className="fixed inset-0 bg-[#111317]/50 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          ref={modalRef}
          tabIndex={-1}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[440px] max-h-[90dvh] overflow-y-auto bg-[#FFFFFF] rounded-2xl border border-[rgba(17,19,23,0.10)] shadow-[0_20px_50px_rgba(17,19,23,0.12)] p-6 sm:p-8 outline-none z-10"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-[#7B838E] hover:text-[#111317] hover:bg-[#F1F2F4] transition-colors disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="mb-5">
            <h3
              id="google-consent-title"
              className="text-lg sm:text-xl font-semibold text-[#111317] tracking-tight"
            >
              Create your Runix account
            </h3>
            <p className="mt-2 text-sm text-[#4E5661] leading-relaxed">
              Before continuing with Google, please review and accept the Runix Terms &amp; Conditions and Privacy Policy.
            </p>
          </div>

          {/* Links Card */}
          <div className="mb-6 p-4 rounded-xl bg-[#F8F9FA] border border-[rgba(17,19,23,0.06)] text-xs text-[#4E5661] space-y-2">
            <div className="flex items-center justify-between">
              <span>Terms of Service:</span>
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#315EF7] hover:underline"
              >
                Review Terms &rarr;
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span>Privacy Policy:</span>
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#315EF7] hover:underline"
              >
                Review Privacy &rarr;
              </Link>
            </div>
          </div>

          {/* Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={isLoading}
                className="mt-0.5 w-4 h-4 rounded border-[rgba(17,19,23,0.25)] text-[#315EF7] focus:ring-[#315EF7]/20 focus:ring-2 cursor-pointer"
              />
              <span className="text-xs text-[#4E5661] group-hover:text-[#111317] transition-colors leading-relaxed">
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-[#111317] underline decoration-[rgba(17,19,23,0.25)] underline-offset-2 hover:decoration-[#111317]"
                >
                  Terms &amp; Conditions
                </Link>{" "}
                and acknowledge the{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-semibold text-[#111317] underline decoration-[rgba(17,19,23,0.25)] underline-offset-2 hover:decoration-[#111317]"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-lg border border-[rgba(17,19,23,0.12)] text-[#4E5661] hover:text-[#111317] hover:bg-[#F1F2F4] text-sm font-medium transition-all cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (agreed && !isLoading) {
                  onConfirm();
                }
              }}
              disabled={!agreed || isLoading}
              className="px-5 py-2.5 rounded-lg bg-[#111317] text-white hover:bg-black active:scale-[0.99] text-sm font-medium transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>{isLoading ? "Connecting..." : "Continue with Google"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
