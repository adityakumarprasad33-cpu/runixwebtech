"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { logLoginEvent } from "@/lib/logLoginEvent";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { safeFetchJson } from "@/lib/safeFetch";
import { GoogleConsentModal } from "@/components/auth/GoogleConsentModal";
import { CURRENT_TERMS_VERSION } from "@/lib/terms";

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingGoogleUser, setPendingGoogleUser] = useState<User | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Layered progressive rate-limit check
      const secRes = await safeFetchJson<{ allowed?: boolean; error?: string }>("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: email.trim(), status: "attempt" }),
      });

      if (!secRes.ok || secRes.data?.allowed === false) {
        throw new Error(secRes.error || "Too many failed attempts. Please try again in a few moments.");
      }

      // 2. Client authentication
      await signInWithEmailAndPassword(auth, email.trim(), password);

      // 3. Log success
      logLoginEvent({ email: email.trim(), action: "login" });
      safeFetchJson("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: email.trim(), status: "success" }),
      }).catch(() => {});

      const cartItem = typeof window !== "undefined" ? localStorage.getItem("pending_cart") : null;
      router.push(cartItem ? "/dashboard?checkout=true" : "/dashboard");
    } catch (err: any) {
      const code: string = err?.code || "";
      let message = "Invalid email or password. Please try again.";

      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        message = "Invalid email or password. Please try again.";
      } else if (code === "auth/too-many-requests") {
        message = "Access temporarily disabled due to multiple failed attempts. Please reset your password or try again later.";
      } else if (code === "auth/network-request-failed") {
        message = "Network connection issue. Please check your internet connection and try again.";
      } else if (err?.message && !err.message.includes("auth/")) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check whether user account exists and has accepted terms
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists() || !userDoc.data()?.termsAccepted) {
        // User is new through Google login route — require Terms consent before creating account
        setPendingGoogleUser(user);
        setShowConsentModal(true);
        setGoogleLoading(false);
        return;
      }

      // Existing verified user
      logLoginEvent({ email: user.email || "", action: "login_google" });
      safeFetchJson("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: user.email, status: "success" }),
      }).catch(() => {});

      const cartItem = typeof window !== "undefined" ? localStorage.getItem("pending_cart") : null;
      router.push(cartItem ? "/dashboard?checkout=true" : "/dashboard");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        // User closed the popup, silently return
        setGoogleLoading(false);
        return;
      }

      console.error("Google sign-in error:", err);
      let msg = "Google sign-in could not be completed. Please try again.";
      if (err?.code === "auth/account-exists-with-different-credential") {
        msg = "An account already exists with the same email using a different sign-in method.";
      } else if (err?.code === "auth/network-request-failed") {
        msg = "Network connection issue. Please check your internet connection.";
      }
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Called when user completes Terms consent in modal for new Google account
  const handleConfirmGoogleConsent = async () => {
    if (!pendingGoogleUser) return;
    setGoogleLoading(true);
    setShowConsentModal(false);

    try {
      const idToken = await pendingGoogleUser.getIdToken();
      const res = await safeFetchJson("/api/auth/record-consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          termsAccepted: true,
          termsVersion: CURRENT_TERMS_VERSION,
          signupMethod: "google_signup",
          name: pendingGoogleUser.displayName || "Runix User",
          email: pendingGoogleUser.email,
        }),
      });

      if (!res.ok) {
        throw new Error(res.error || "Failed to record consent. Please try again.");
      }

      logLoginEvent({ email: pendingGoogleUser.email || "", action: "register_google" });
      const cartItem = typeof window !== "undefined" ? localStorage.getItem("pending_cart") : null;
      router.push(cartItem ? "/dashboard?checkout=true" : "/dashboard");
    } catch (err: any) {
      setError(err?.message || "Could not complete account setup. Please try again.");
    } finally {
      setGoogleLoading(false);
      setPendingGoogleUser(null);
    }
  };

  const isBusy = loading || googleLoading;

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
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#4E5661] hover:text-[#111317] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </div>

      {/* Desktop "Back to Runix" link */}
      <div className="hidden lg:block mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#4E5661] hover:text-[#111317] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Runix</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#111317] leading-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-[#4E5661]">
          Sign in to continue to your Runix account.
        </p>
      </div>

      {/* Continue with Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isBusy}
        className="w-full h-12 flex items-center justify-center gap-3 bg-[#FFFFFF] hover:bg-[#F8F9FA] active:bg-[#F1F2F4] border border-[rgba(17,19,23,0.12)] hover:border-[rgba(17,19,23,0.22)] text-[#111317] font-medium text-sm rounded-lg transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#4E5661]" />
        ) : (
          <GoogleIcon className="w-4 h-4" />
        )}
        <span>{googleLoading ? "Connecting..." : "Continue with Google"}</span>
      </button>

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="border-t border-[rgba(17,19,23,0.08)] w-full" />
        <span className="bg-[#FFFFFF] px-3 text-[11px] font-medium uppercase tracking-wider text-[#7B838E] shrink-0">
          or continue with email
        </span>
        <div className="border-t border-[rgba(17,19,23,0.08)] w-full" />
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-lg bg-[#D83A3A]/08 border border-[#D83A3A]/20 text-[#D83A3A] text-xs font-medium leading-relaxed flex items-start gap-2.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#D83A3A] mt-1.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email + Password Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-[#4E5661] mb-1.5"
          >
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isBusy}
            placeholder="you@example.com"
            className="w-full h-12 bg-[#FFFFFF] border border-[rgba(17,19,23,0.12)] rounded-lg px-4 text-[#111317] text-sm placeholder:text-[#7B838E] focus:outline-none focus:border-[#315EF7] focus:ring-2 focus:ring-[#315EF7]/15 transition-all disabled:opacity-50"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="text-xs font-medium text-[#4E5661]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[#315EF7] hover:text-[#2244C4] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isBusy}
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

        {/* Remember me */}
        <div className="flex items-center pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(17,19,23,0.25)] text-[#315EF7] focus:ring-[#315EF7]/20 focus:ring-2 cursor-pointer"
            />
            <span className="text-xs text-[#4E5661]">Remember this device</span>
          </label>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isBusy}
          className="w-full h-12 mt-2 rounded-lg bg-[#111317] hover:bg-[#20242C] active:scale-[0.99] text-white text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white/80" />
              <span>Signing in…</span>
            </>
          ) : (
            <span>Log in</span>
          )}
        </button>
      </form>

      {/* Secondary Navigation */}
      <div className="mt-8 pt-6 border-t border-[rgba(17,19,23,0.06)] text-center">
        <p className="text-xs text-[#4E5661]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#111317] hover:text-[#315EF7] transition-colors ml-1"
          >
            Create one
          </Link>
        </p>

        {/* Legal Links */}
        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-[#7B838E]">
          <Link href="/privacy" className="hover:text-[#111317] transition-colors">
            Privacy
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-[#111317] transition-colors">
            Terms
          </Link>
        </div>
      </div>

      {/* Google Terms Consent Modal for first-time Google sign-ins */}
      <GoogleConsentModal
        isOpen={showConsentModal}
        onClose={() => {
          setShowConsentModal(false);
          setPendingGoogleUser(null);
        }}
        onConfirm={handleConfirmGoogleConsent}
        isLoading={googleLoading}
      />
    </div>
  );
}
