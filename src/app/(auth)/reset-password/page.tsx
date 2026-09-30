"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") || "";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [emailForCode, setEmailForCode] = useState("");
  const [codeValid, setCodeValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!oobCode) {
      setVerifying(false);
      setError("No password reset code found. Please request a new password reset link.");
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmailForCode(email);
        setCodeValid(true);
      })
      .catch((err) => {
        console.warn("Reset code verification error:", err);
        setError("This password reset link is invalid or has expired. Please request a new one.");
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both password fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="w-full max-w-[420px] mx-auto py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#4E5661] mx-auto mb-3" />
        <p className="text-sm text-[#4E5661]">Verifying reset link…</p>
      </div>
    );
  }

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

      {success ? (
        <div className="space-y-6">
          <div className="w-10 h-10 rounded-full bg-[#169B62]/10 text-[#169B62] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#111317]">
              Password updated
            </h1>
            <p className="mt-2 text-sm text-[#4E5661]">
              Your password has been successfully reset. You can now sign in with your new credentials.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="w-full h-12 rounded-lg bg-[#111317] hover:bg-[#20242C] text-white text-sm font-medium transition-all flex items-center justify-center shadow-xs"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      ) : !codeValid ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#111317]">
              Invalid or expired link
            </h1>
            <p className="mt-2 text-sm text-[#4E5661] leading-relaxed">
              {error || "This password reset link is invalid or has expired."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/forgot-password"
              className="w-full h-12 rounded-lg bg-[#111317] hover:bg-[#20242C] text-white text-sm font-medium transition-all flex items-center justify-center shadow-xs"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#111317] leading-tight">
              Create new password
            </h1>
            <p className="mt-2 text-sm text-[#4E5661]">
              Enter a new secure password for <span className="font-semibold text-[#111317]">{emailForCode}</span>.
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="new-password" className="text-xs font-medium text-[#4E5661]">
                  New password
                </label>
                <span className="text-[11px] text-[#7B838E]">At least 8 characters</span>
              </div>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full h-12 bg-[#FFFFFF] border border-[rgba(17,19,23,0.12)] rounded-lg pl-4 pr-11 text-[#111317] text-sm placeholder:text-[#7B838E] focus:outline-none focus:border-[#315EF7] focus:ring-2 focus:ring-[#315EF7]/15 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7B838E] hover:text-[#111317] transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block text-xs font-medium text-[#4E5661] mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                className="w-full h-12 bg-[#FFFFFF] border border-[rgba(17,19,23,0.12)] rounded-lg px-4 text-[#111317] text-sm placeholder:text-[#7B838E] focus:outline-none focus:border-[#315EF7] focus:ring-2 focus:ring-[#315EF7]/15 transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="w-full h-12 mt-2 rounded-lg bg-[#111317] hover:bg-[#20242C] active:scale-[0.99] text-white text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                  <span>Updating password…</span>
                </>
              ) : (
                <span>Update password</span>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[420px] mx-auto py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#4E5661] mx-auto mb-3" />
          <p className="text-sm text-[#4E5661]">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
