"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { safeFetchJson } from "@/lib/safeFetch";

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const currentUser = auth.currentUser;

  const handleResend = async () => {
    if (!currentUser) {
      setError("Please sign in to resend the verification email.");
      return;
    }

    setResending(true);
    setError("");

    try {
      // Check rate limit
      const secRes = await safeFetchJson<{ allowed?: boolean; error?: string }>("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_email", email: currentUser.email || "", status: "attempt" }),
      });

      if (!secRes.ok || secRes.data?.allowed === false) {
        throw new Error(secRes.error || "Too many requests. Please wait a moment before trying again.");
      }

      await sendEmailVerification(currentUser);
      setResent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification email. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto py-2 sm:py-4">
      {/* Mobile Brand Bar */}
      <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-[rgba(17,19,23,0.06)]">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="relative w-6 h-6 shrink-0">
            <Image src="/logo-v2.png" alt="Runix" fill sizes="24px" className="object-contain" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#111317]">Runix</span>
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[#4E5661] hover:text-[#111317] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Back link */}
      <div className="hidden lg:block mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#4E5661] hover:text-[#111317] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Runix</span>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="w-10 h-10 rounded-full bg-[#315EF7]/10 text-[#315EF7] flex items-center justify-center">
          <Mail className="w-5 h-5" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#111317] leading-tight">
            Verify your email
          </h1>
          <p className="mt-2 text-sm text-[#4E5661] leading-relaxed">
            We sent a verification link to{" "}
            <span className="font-semibold text-[#111317]">
              {currentUser?.email || "your registered email"}
            </span>
            . Please check your inbox to confirm your account.
          </p>
        </div>

        {resent && (
          <div className="p-3.5 rounded-lg bg-[#169B62]/10 border border-[#169B62]/20 text-[#169B62] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>A new verification email has been sent.</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-[#D83A3A]/08 border border-[#D83A3A]/20 text-[#D83A3A] text-xs font-medium leading-relaxed"
          >
            {error}
          </div>
        )}

        <div className="space-y-3 pt-2">
          {currentUser && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resent}
              className="w-full h-12 rounded-lg bg-[#111317] hover:bg-[#20242C] active:scale-[0.99] text-white text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                  <span>Sending…</span>
                </>
              ) : (
                <span>Resend verification email</span>
              )}
            </button>
          )}

          <Link
            href="/dashboard"
            className="w-full h-12 rounded-lg border border-[rgba(17,19,23,0.12)] text-[#111317] hover:bg-[#F8F9FA] text-sm font-medium transition-all flex items-center justify-center shadow-xs"
          >
            Continue to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
