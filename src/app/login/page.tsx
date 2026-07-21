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
import { ArrowLeft, Hexagon, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [failCount, setFailCount] = useState(0);
  const [backoffUntil, setBackoffUntil] = useState(0);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < backoffUntil) return;
    setLoading(true);
    setError("");

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#050505]">
      {/* Left Side - Animated Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 border-r border-white/5 items-center justify-center overflow-hidden">
        {/* Background Grid & Glows */}
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="absolute top-1/4 -left-1/4 w-[150%] aspect-square bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-1/4 -right-1/4 w-[150%] aspect-square bg-purple-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

        <div className="relative z-10 w-full max-w-lg px-12 flex flex-col items-start">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-16">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to Home</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative w-20 h-20 mb-8 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              <Image src="/logo-v2.png" alt="Runix Logo" fill className="object-contain" />
            </div>
            <h1 className="font-jakarta text-5xl font-black text-white leading-tight mb-6 tracking-tight">
              Welcome back to <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Runix</span>
            </h1>
            <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-md">
              Access your dashboard to manage active services, view project progress, and collaborate with our team.
            </p>
          </motion.div>

          {/* Floating Elements Animation */}
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-10 top-1/3 opacity-30 pointer-events-none"
          >
            <Hexagon className="w-24 h-24 text-indigo-500" strokeWidth={1} />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute left-10 bottom-1/4 opacity-30 pointer-events-none"
          >
            <Sparkles className="w-16 h-16 text-purple-500" strokeWidth={1} />
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <Link href="/" className="lg:hidden absolute top-8 left-8 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors z-20">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Home</span>
        </Link>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="text-center lg:text-left mb-10">
            <h2 className="font-jakarta text-3xl font-bold text-white mb-3">Sign In</h2>
            <p className="text-zinc-400 font-medium">Enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <Button type="submit" variant="accent" className="w-full rounded-xl h-14 text-base shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all" disabled={loading}>
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
    </div>
  );
}
