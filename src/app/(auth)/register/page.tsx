"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { updateHeroState, heroHandleRef } = useAuthHero();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const authStartTime = Date.now();
    updateHeroState("authenticating");

    // Log register event immediately to capture attempts (IP, location, timezone, time)
    logLoginEvent({ email: formData.email, action: "register" });

    try {
      const secRes = await fetch("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", email: formData.email, status: "attempt" }),
      });

      if (!secRes.ok) {
        const data = await secRes.json();
        throw new Error(data.error || "Security check failed.");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.name });

      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        role: "user",
        createdAt: serverTimestamp(),
      });

      await fetch("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", email: formData.email, status: "success" }),
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
      if (cartItem) {
        router.push("/dashboard?checkout=true");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account. Please try again.");
      updateHeroState("error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError("");
    const authStartTime = Date.now();
    updateHeroState("authenticating");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists or create new doc
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "Google User",
          email: user.email || "",
          phone: user.phoneNumber || "",
          location: "",
          photoURL: user.photoURL || "",
          role: "user",
          authProvider: "google",
          createdAt: serverTimestamp(),
        });
      }

      logLoginEvent({ email: user.email || "", action: "register_google" });
      await fetch("/api/auth/check-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", email: user.email, status: "success" }),
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
      if (cartItem) {
        router.push("/dashboard?checkout=true");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        updateHeroState("idle");
        setGoogleLoading(false);
        return;
      }
      console.error("Google register error:", err);
      setError(err?.message || "Google sign-up failed. Please try again.");
      updateHeroState("error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const isBusy = loading || googleLoading;

  return (
    <div className="w-full h-full flex flex-col justify-center px-6 py-12 sm:px-12 relative bg-zinc-950 overflow-y-auto">
      <Link href="/" className="absolute top-8 left-8 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors z-20">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Home</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl mx-auto py-20 lg:py-0"
      >
        <div className="text-center lg:text-left mb-8">
          <div className="lg:hidden relative w-12 h-12 mb-6 mx-auto">
            <Image src="/logo-v2.png" alt="Runix Logo" fill sizes="48px" className="object-contain" />
          </div>
          <h2 className="font-jakarta text-3xl font-bold text-white mb-3">Create an Account</h2>
          <p className="text-zinc-400 font-medium">Join us to start building your digital future.</p>
        </div>

        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={isBusy}
          className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 active:bg-white/[0.15] border border-white/15 hover:border-white/25 text-white font-semibold py-3.5 px-5 rounded-xl transition-all shadow-sm hover:shadow-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
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
            or register with email
          </span>
          <div className="border-t border-white/10 w-full" />
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Full Name</label>
              <input 
                type="text" 
                name="name"
                required 
                value={formData.name}
                onChange={handleChange}
                disabled={isBusy}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium hover:bg-white/10 disabled:opacity-50" 
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
              <input 
                type="email" 
                name="email"
                required 
                value={formData.email}
                onChange={handleChange}
                onFocus={() => updateHeroState("email-focus")}
                onBlur={() => updateHeroState("idle")}
                disabled={isBusy}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium hover:bg-white/10 disabled:opacity-50" 
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                required 
                value={formData.phone}
                onChange={handleChange}
                disabled={isBusy}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium hover:bg-white/10 disabled:opacity-50" 
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Location (City, Country)</label>
              <input 
                type="text" 
                name="location"
                required 
                value={formData.location}
                onChange={handleChange}
                disabled={isBusy}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium hover:bg-white/10 disabled:opacity-50" 
                placeholder="New York, USA"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Password</label>
            <input 
              type="password" 
              name="password"
              required 
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              onFocus={() => updateHeroState("password-focus")}
              onBlur={() => updateHeroState("idle")}
              disabled={isBusy}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium hover:bg-white/10 disabled:opacity-50" 
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" variant="default" className="w-full rounded-xl h-14 text-base transition-all" disabled={isBusy}>
            {loading ? "Creating Account..." : "Register Now"}
          </Button>
        </form>

        <div className="mt-8 text-center lg:text-left">
          <p className="text-zinc-400 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-white font-bold hover:text-purple-400 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

