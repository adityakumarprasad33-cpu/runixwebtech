"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { logLoginEvent } from "@/lib/logLoginEvent";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuthHero } from "@/components/auth/AuthHeroContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
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
        <div className="text-center lg:text-left mb-10">
          <div className="lg:hidden relative w-12 h-12 mb-6 mx-auto">
            <Image src="/logo-v2.png" alt="Runix Logo" fill className="object-contain" />
          </div>
          <h2 className="font-jakarta text-3xl font-bold text-white mb-3">Create an Account</h2>
          <p className="text-zinc-400 font-medium">Join us to start building your digital future.</p>
        </div>

          <form onSubmit={handleRegister} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  required 
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium hover:bg-white/10" 
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium hover:bg-white/10" 
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  required 
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium hover:bg-white/10" 
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium hover:bg-white/10" 
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium hover:bg-white/10" 
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" variant="default" className="w-full rounded-xl h-14 text-base transition-all" disabled={loading}>
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
