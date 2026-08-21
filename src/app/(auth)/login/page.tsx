"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { logLoginEvent } from "@/lib/logLoginEvent";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuthHero } from "@/components/auth/AuthHeroContext";

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
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
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [failCount, setFailCount] = useState(0);
  const [backoffUntil, setBackoffUntil] = useState(0);
  const router = useRouter();
  
  const { updateHeroState, heroHandleRef } = useAuthHero();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < backoffUntil) return;
    setLoading(true);
    setError("");
    const authStartTime = Date.now();
    updateHeroState("authenticating");

    logLoginEvent({ email, action: "login" });

    try {
      const secRes = await fetch("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, status: "attempt" }),
      });

      if (!secRes.ok) {
        const data = await secRes.json();
        setFailCount((c) => c + 1);
        setBackoffUntil(Date.now() + 3000);
        throw new Error(data.error || "Security check failed. Try again later.");
      }

      await signInWithEmailAndPassword(auth, email, password);

      await fetch("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, status: "success" }),
      }).catch(console.error);

      // Ensure the authenticating animation is visible for at least 1500ms
      const elapsed = Date.now() - authStartTime;
      const minVisualDelay = 1500;
      if (elapsed < minVisualDelay) {
        await new Promise((resolve) => setTimeout(resolve, minVisualDelay - elapsed));
      }

      if (heroHandleRef.current) {
        await heroHandleRef.current.playSuccessSequence();
      }

      const cartItem = localStorage.getItem("pending_cart");
      router.push(cartItem ? "/dashboard?checkout=true" : "/dashboard");
    } catch (err: any) {
      // Normalize Firebase auth error codes to a generic message
      const code: string = err?.code || "";
      const isAuthError = code.startsWith("auth/");
      const normalizedMsg = isAuthError
        ? "Invalid email or password. Please try again."
        : err.message || "Login failed. Please try again.";
      setFailCount((c) => c + 1);
      setBackoffUntil(Date.now() + 3000 * Math.min(failCount + 1, 5));
      setError(normalizedMsg);
      updateHeroState("error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Date.now() < backoffUntil) return;
    setGoogleLoading(true);
    setError("");
    const authStartTime = Date.now();
    updateHeroState("authenticating");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verify whether user already registered in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // User has not registered yet — sign out immediately and notify
        await auth.signOut();
        setFailCount((c) => c + 1);
        setError("No account found with this Google email. Please register/create an account first.");
        updateHeroState("error");
        setGoogleLoading(false);
        return;
      }

      // Existing verified user
      logLoginEvent({ email: user.email || "", action: "login_google" });
      await fetch("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: user.email, status: "success" }),
      }).catch(console.error);

      const elapsed = Date.now() - authStartTime;
      const minVisualDelay = 1200;
      if (elapsed < minVisualDelay) {
        await new Promise((resolve) => setTimeout(resolve, minVisualDelay - elapsed));
      }

      if (heroHandleRef.current) {
        await heroHandleRef.current.playSuccessSequence();
      }

      const cartItem = localStorage.getItem("pending_cart");
      router.push(cartItem ? "/dashboard?checkout=true" : "/dashboard");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        updateHeroState("idle");
        setGoogleLoading(false);
        return;
      }
      console.error("Google login error:", err);
      setError(err?.message || "Google sign-in failed. Please try again.");
      updateHeroState("error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const isBusy = loading || googleLoading;

  return (
    <div className="w-full h-full flex flex-col justify-center px-6 py-12 sm:px-12 relative bg-zinc-950">
      <Link href="/" className="absolute top-8 left-8 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors z-20">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Home</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md mx-auto"
      >
        <div className="text-center lg:text-left mb-8">
          <div className="lg:hidden relative w-12 h-12 mb-6 mx-auto">
            <Image src="/logo-v2.png" alt="Runix Logo" fill sizes="48px" className="object-contain" />
          </div>
          <h2 className="font-jakarta text-3xl font-bold text-white mb-3">Welcome back</h2>
          <p className="text-zinc-400 font-medium">Sign in to continue to Runix.</p>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isBusy}
          className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 active:bg-white/[0.15] border border-white/15 hover:border-white/25 text-white font-semibold py-3.5 px-5 rounded-xl transition-all shadow-sm hover:shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
        >
          <GoogleIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-sm">
            {googleLoading ? "Connecting to Google..." : "Continue with Google"}
          </span>
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-zinc-950 px-3 text-xs uppercase tracking-wider text-zinc-500 font-bold shrink-0">
            or sign in with email
          </span>
          <div className="border-t border-white/10 w-full" />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => updateHeroState("email-focus")}
              onBlur={() => updateHeroState("idle")}
              disabled={isBusy}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium hover:bg-white/10 disabled:opacity-50" 
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => updateHeroState("password-focus")}
              onBlur={() => updateHeroState("idle")}
              disabled={isBusy}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium hover:bg-white/10 disabled:opacity-50" 
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" variant="accent" className="w-full rounded-xl h-14 text-base transition-all" disabled={isBusy}>
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </Button>
        </form>

        <div className="mt-8 text-center lg:text-left">
          <p className="text-zinc-400 text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-white font-bold hover:text-indigo-400 transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

