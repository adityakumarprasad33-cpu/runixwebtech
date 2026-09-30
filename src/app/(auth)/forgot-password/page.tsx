"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { safeFetchJson } from "@/lib/safeFetch";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Rate limit check
      const secRes = await safeFetchJson<{ allowed?: boolean; error?: string }>("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgot_password", email: email.trim(), status: "attempt" }),
      });

      if (!secRes.ok || secRes.data?.allowed === false) {
        throw new Error(secRes.error || "Too many password reset requests. Please try again later.");
      }

      // Send Firebase password reset email
      try {
        await sendPasswordResetEmail(auth, email.trim());
      } catch (fbErr: any) {
        // Do not leak whether user exists
        if (fbErr?.code !== "auth/user-not-found") {
          console.warn("Password reset error notice:", fbErr?.message);
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to process request. Please try again later.");
    } finally {
      setLoading(false);
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
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[#4E5661] hover:text-[#111317] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Login</span>
        </Link>
      </div>

      {/* Back to Login link */}
      <div className="hidden lg:block mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#4E5661] hover:text-[#111317] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to login</span>
        </Link>
      </div>

      {submitted ? (
        <div className="space-y-6">
          <div className="w-10 h-10 rounded-full bg-[#169B62]/10 text-[#169B62] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#111317]">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-[#4E5661] leading-relaxed">
              If an account exists for <span className="font-semibold text-[#111317]">{email}</span>, we have sent instructions to reset your password.
            </p>
            <p className="mt-3 text-xs text-[#7B838E] leading-relaxed">
              Be sure to check your spam or promotions folder if the email does not arrive within a few minutes.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full h-12 rounded-lg bg-[#111317] hover:bg-[#20242C] text-white text-sm font-medium transition-all flex items-center justify-center shadow-xs"
            >
              Return to login
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#111317] leading-tight">
              Reset your password
            </h1>
            <p className="mt-2 text-sm text-[#4E5661]">
              Enter your email address and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-[#D83A3A]/08 border border-[#D83A3A]/20 text-[#D83A3A] text-xs font-medium leading-relaxed flex items-start gap-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D83A3A] mt-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-medium text-[#4E5661] mb-1.5">
                Email address
              </label>
              <input
                id="reset-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
                className="w-full h-12 bg-[#FFFFFF] border border-[rgba(17,19,23,0.12)] rounded-lg px-4 text-[#111317] text-sm placeholder:text-[#7B838E] focus:outline-none focus:border-[#315EF7] focus:ring-2 focus:ring-[#315EF7]/15 transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-12 mt-2 rounded-lg bg-[#111317] hover:bg-[#20242C] active:scale-[0.99] text-white text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                  <span>Sending link…</span>
                </>
              ) : (
                <span>Send reset link</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[rgba(17,19,23,0.06)] text-center">
            <p className="text-xs text-[#4E5661]">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#111317] hover:text-[#315EF7] transition-colors ml-1"
              >
                Log in
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
