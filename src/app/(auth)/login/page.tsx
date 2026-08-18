"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { logLoginEvent } from "@/lib/logLoginEvent";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuthHero } from "@/components/auth/AuthHeroContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
        <div className="text-center lg:text-left mb-10">
          <div className="lg:hidden relative w-12 h-12 mb-6 mx-auto">
            <Image src="/logo-v2.png" alt="Runix Logo" fill className="object-contain" />
          </div>
          <h2 className="font-jakarta text-3xl font-bold text-white mb-3">Welcome back</h2>
          <p className="text-zinc-400 font-medium">Sign in to continue to Runix.</p>
        </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => updateHeroState("email-focus")}
                onBlur={() => updateHeroState("idle")}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium hover:bg-white/10" 
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium hover:bg-white/10" 
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" variant="accent" className="w-full rounded-xl h-14 text-base transition-all" disabled={loading}>
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
