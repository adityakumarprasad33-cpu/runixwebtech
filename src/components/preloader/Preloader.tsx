"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────────────
 * Realistic SVG Drafting Pen — rendered as pure vector paths
 * ───────────────────────────────────────────────────────────────────────────── */
function StylusPen() {
  return (
    <svg
      width="16"
      height="68"
      viewBox="0 0 16 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_2px_10px_rgba(99,102,241,0.5)]"
    >
      <defs>
        <linearGradient id="barrel-upper" x1="0" y1="0" x2="16" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="30%" stopColor="#d1d5db" />
          <stop offset="50%" stopColor="#f9fafb" />
          <stop offset="70%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
        <linearGradient id="barrel-lower" x1="0" y1="0" x2="16" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="30%" stopColor="#4338ca" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="70%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        <linearGradient id="nib-grad" x1="8" y1="48" x2="8" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="60%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <radialGradient id="tip-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
          <stop offset="60%" stopColor="#818cf8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cap top */}
      <rect x="4" y="0" width="8" height="4" rx="2" fill="#b4b9c6" />
      {/* Clip */}
      <rect x="11" y="1" width="2" height="12" rx="1" fill="#d1d5db" />
      <rect x="11" y="12" width="2.5" height="2" rx="1" fill="#9ca3af" />
      {/* Upper barrel */}
      <rect x="4" y="4" width="8" height="22" rx="1.5" fill="url(#barrel-upper)" />
      {/* Grip band */}
      <rect x="3.5" y="25" width="9" height="3" rx="1.5" fill="#818cf8" opacity="0.85" />
      <rect x="3.5" y="25" width="9" height="1" rx="0.5" fill="#c7d2fe" opacity="0.5" />
      {/* Lower barrel */}
      <rect x="4" y="28" width="8" height="20" rx="1.5" fill="url(#barrel-lower)" />
      {/* Barrel reflection */}
      <rect x="7" y="5" width="1.2" height="42" rx="0.6" fill="white" opacity="0.1" />
      {/* Nib */}
      <polygon points="5,48 11,48 8,65" fill="url(#nib-grad)" />
      {/* Nib slit */}
      <line x1="8" y1="51" x2="8" y2="64" stroke="#1f2937" strokeWidth="0.5" />
      {/* Glowing tip */}
      <circle cx="8" cy="66" r="2" fill="url(#tip-glow)">
        <animate attributeName="r" values="1.5;2.5;1.5" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("fonts" in document) {
      document.fonts.ready.catch(() => {});
    }

    const startTime = performance.now();
    const totalDuration = 3000;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressRatio = Math.min(1, elapsed / totalDuration);

      const easeProgress = Math.floor(
        (progressRatio < 0.5
          ? 4 * progressRatio * progressRatio * progressRatio
          : 1 - Math.pow(-2 * progressRatio + 2, 3) / 2) * 100
      );

      const currentProgress = Math.min(100, Math.max(0, easeProgress));
      setProgress(currentProgress);

      if (progressRatio < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setIsFinished(true);
          setTimeout(() => {
            setIsMounted(false);
          }, 700);
        }, 280);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleSkip = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setProgress(100);
    setIsFinished(true);
    setTimeout(() => setIsMounted(false), 400);
  };

  if (!isMounted) return null;

  const stageCaption =
    progress < 25
      ? "Drafting UI architecture & wireframe blueprints..."
      : progress < 55
      ? "Folding component layers & pre-rendering modules..."
      : progress < 80
      ? "Injecting design tokens & styling engines..."
      : progress < 98
      ? "Assembling workspace canvas..."
      : "Welcome to Runix Web Technologies";

  // Pen position — constrained within the right page of the notebook
  // Right page spans roughly 52%–95% of X and 8%–85% of Y
  const penX =
    progress < 25
      ? 58 + progress * 0.8    // 58 → 78
      : progress < 55
      ? 82 - (progress - 25) * 0.6  // 82 → 64
      : progress < 80
      ? 62 + (progress - 55) * 0.7  // 62 → 79.5
      : 75 + Math.sin(progress * 0.2) * 3;

  const penY =
    progress < 25
      ? 12 + progress * 0.8   // 12 → 32
      : progress < 55
      ? 32 + (progress - 25) * 0.8  // 32 → 56
      : progress < 80
      ? 56 + (progress - 55) * 0.6  // 56 → 71
      : 68 + Math.cos(progress * 0.2) * 2;

  // 3D page flip rotation (0 → 175 degrees)
  const pageFoldAngle = Math.min(175, Math.max(0, (progress - 20) * (175 / 55)));

  return (
    <AnimatePresence mode="wait">
      {!isFinished && (
        <motion.div
          key="runix-blueprint-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            filter: "blur(12px)",
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#050508] text-white overflow-hidden select-none"
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
          <div className="absolute w-[500px] h-[500px] bg-indigo-600/12 blur-[180px] rounded-full pointer-events-none animate-pulse" />
          <div className="absolute w-[400px] h-[400px] bg-purple-500/8 blur-[150px] rounded-full pointer-events-none translate-y-20" />

          {/* ── 3D Isometric Notebook & Stylus Canvas ── */}
          <div
            className="relative w-[340px] h-[240px] sm:w-[480px] sm:h-[310px] flex items-center justify-center"
            style={{ perspective: "1300px" }}
          >
            {/* 3D Isometric Tilt */}
            <motion.div
              initial={{ rotateX: 22, rotateY: -14, rotateZ: 2, scale: 0.92 }}
              animate={{
                rotateX: [22, 18, 22],
                rotateY: [-14, -10, -14],
                rotateZ: [2, 0.5, 2],
                scale: [0.92, 0.96, 0.92],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full flex items-center justify-center"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Desk shadow */}
              <div className="absolute inset-0 bg-indigo-950/25 blur-3xl rounded-3xl -translate-y-5 scale-90 opacity-50" />

              {/* ── Open Notebook ── */}
              <div
                className="relative w-full h-full rounded-xl bg-[#0a0b14]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(99,102,241,0.15)] flex overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* ── LEFT PAGE: Code Blueprint ── */}
                <div className="relative flex-1 h-full p-4 sm:p-5 bg-gradient-to-br from-indigo-950/25 to-black/50 flex flex-col justify-between overflow-hidden">
                  {/* Faint grid texture */}
                  <div
                    className="absolute inset-0 opacity-[0.07] pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />

                  {/* Code content */}
                  <div className="space-y-1.5 relative z-10 pt-1">
                    <div className="space-y-1.5 font-mono text-[8px] sm:text-[9px] text-zinc-400 leading-relaxed">
                      <div className="flex items-center gap-1 text-indigo-400">
                        <span>const</span>
                        <span className="text-white font-semibold">Workspace</span> = <span className="text-purple-300">defineConfig</span>({`{`}
                      </div>
                      <div className="pl-3 text-cyan-300/80">framework: &quot;Next.js 16&quot;,</div>
                      <div className="pl-3 text-indigo-300/80">styling: &quot;Tailwind + Motion&quot;,</div>
                      <div className="pl-3 text-emerald-300/80">database: &quot;Firestore&quot;,</div>
                      <div className="pl-3 text-amber-300/80">payments: &quot;UPI Gateway&quot;,</div>
                      <div className="text-indigo-400/80">{`});`}</div>
                    </div>
                  </div>

                  {/* Bottom status chips */}
                  <div className="relative z-10 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-5 flex-1 rounded-md bg-indigo-500/8 flex items-center justify-center">
                        <div className="w-10 h-0.5 rounded bg-indigo-400/30" />
                      </div>
                      <div className="h-5 flex-1 rounded-md bg-purple-500/8 flex items-center justify-center">
                        <div className="w-10 h-0.5 rounded bg-purple-400/30" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SPINE BINDER (subtle) ── */}
                <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-3 z-20 flex flex-col justify-evenly items-center pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-1 rounded-full bg-indigo-400/60 shadow-[0_0_6px_rgba(129,140,248,0.4)]"
                    />
                  ))}
                  <div className="absolute inset-y-0 w-[0.5px] bg-indigo-400/20" />
                </div>

                {/* ── RIGHT PAGE: Live Drawing Canvas ── */}
                <div className="relative flex-1 h-full p-4 sm:p-5 bg-gradient-to-bl from-purple-950/20 to-black/50 flex flex-col overflow-hidden">
                  {/* Faint grid texture */}
                  <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #a855f7 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />

                  {/* SVG Drawing Paths */}
                  <svg className="relative z-10 w-full h-full overflow-visible">
                    {/* 1. Navbar */}
                    <motion.rect
                      x="2"
                      y="4"
                      width="100%"
                      height="16"
                      rx="3"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="1"
                      strokeDasharray="400"
                      strokeDashoffset={Math.max(0, 400 - progress * 4)}
                      opacity="0.7"
                      style={{ filter: "drop-shadow(0 0 3px rgba(129,140,248,0.3))" }}
                    />
                    <circle cx="10" cy="12" r="2" fill="#38bdf8" opacity="0.8" />
                    <line x1="18" y1="12" x2="32" y2="12" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                    <line x1="36" y1="12" x2="50" y2="12" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

                    {/* 2. Hero Section */}
                    <motion.rect
                      x="4"
                      y="28"
                      width="92%"
                      height="22"
                      rx="3"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      strokeDasharray="300"
                      strokeDashoffset={Math.max(0, 300 - Math.max(0, progress - 18) * 5)}
                      opacity="0.6"
                      style={{ filter: "drop-shadow(0 0 4px rgba(56,189,248,0.3))" }}
                    />
                    <line x1="10" y1="37" x2="80" y2="37" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                    <line x1="10" y1="43" x2="55" y2="43" stroke="#a855f7" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

                    {/* 3. Three Cards */}
                    <motion.rect
                      x="4"
                      y="58"
                      width="36"
                      height="38"
                      rx="3"
                      fill="rgba(99,102,241,0.05)"
                      stroke="#818cf8"
                      strokeWidth="0.8"
                      strokeDasharray="160"
                      strokeDashoffset={Math.max(0, 160 - Math.max(0, progress - 38) * 4)}
                      opacity="0.6"
                    />
                    <motion.rect
                      x="44"
                      y="58"
                      width="36"
                      height="38"
                      rx="3"
                      fill="rgba(168,85,247,0.05)"
                      stroke="#c084fc"
                      strokeWidth="0.8"
                      strokeDasharray="160"
                      strokeDashoffset={Math.max(0, 160 - Math.max(0, progress - 50) * 4)}
                      opacity="0.6"
                    />
                    <motion.rect
                      x="84"
                      y="58"
                      width="36"
                      height="38"
                      rx="3"
                      fill="rgba(236,72,153,0.04)"
                      stroke="#f472b6"
                      strokeWidth="0.8"
                      strokeDasharray="160"
                      strokeDashoffset={Math.max(0, 160 - Math.max(0, progress - 62) * 4)}
                      opacity="0.6"
                    />

                    {/* 4. CTA Button */}
                    <motion.rect
                      x="28"
                      y="104"
                      width="70"
                      height="14"
                      rx="7"
                      fill="rgba(56,189,248,0.08)"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      strokeDasharray="180"
                      strokeDashoffset={Math.max(0, 180 - Math.max(0, progress - 78) * 9)}
                      opacity="0.7"
                      style={{ filter: "drop-shadow(0 0 6px rgba(56,189,248,0.4))" }}
                    />
                    <line x1="44" y1="111" x2="82" y2="111" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                  </svg>
                </div>

                {/* ── 3D FOLDING PAGE ── */}
                <motion.div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: "50%",
                    transformOrigin: "left center",
                    transformStyle: "preserve-3d",
                    rotateY: -pageFoldAngle,
                    backfaceVisibility: "hidden",
                    zIndex: 30,
                  }}
                  className="rounded-r-xl bg-[#0c0e1a]/95 p-4 sm:p-5 shadow-[-12px_0_25px_rgba(0,0,0,0.8)] flex flex-col justify-between overflow-hidden"
                >
                  {/* Crease shading */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-indigo-950/10 pointer-events-none" />

                  {/* Page content wireframes */}
                  <div className="relative z-10 space-y-3 opacity-60">
                    <div className="w-full h-10 rounded-md bg-cyan-950/20 p-2 space-y-1">
                      <div className="w-14 h-1 rounded bg-cyan-400/40" />
                      <div className="w-20 h-0.5 rounded bg-white/20" />
                      <div className="w-16 h-0.5 rounded bg-white/15" />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="h-8 rounded-md bg-indigo-950/20" />
                      <div className="h-8 rounded-md bg-purple-950/20" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ── REALISTIC SVG PEN ── */}
              <motion.div
                style={{
                  position: "absolute",
                  left: `${penX}%`,
                  top: `${penY}%`,
                  transformOrigin: "50% 100%",
                  zIndex: 50,
                  pointerEvents: "none",
                }}
                animate={{
                  rotate: [-45, -40, -45],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <StylusPen />

                {/* Subtle ink glow at pen tip */}
                <motion.div
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2"
                  animate={{
                    scale: [0.7, 1.1, 0.7],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-3 h-3 rounded-full bg-cyan-400/25 blur-[3px]" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* ── Brand, Progress Bar & Caption ── */}
          <div className="mt-7 sm:mt-9 flex flex-col items-center gap-3 text-center px-4 max-w-md z-20">
            {/* Brand Title — clean, no dot */}
            <h2 className="text-sm sm:text-base font-black tracking-[0.25em] text-white uppercase font-jakarta">
              RUNIX{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
                WEBTECH
              </span>
            </h2>

            {/* Stage Caption */}
            <div className="h-5 flex items-center justify-center">
              <motion.p
                key={stageCaption}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-mono text-zinc-500 tracking-tight"
              >
                {stageCaption}
              </motion.p>
            </div>

            {/* Progress Bar — minimal, no border */}
            <div className="w-52 sm:w-60 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                style={{ width: `${progress}%`, transition: "width 0.05s linear" }}
              />
            </div>

            {/* Skip — ghost text, no brackets or border */}
            <button
              onClick={handleSkip}
              className="mt-1 text-[10px] font-mono text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-widest cursor-pointer"
            >
              skip intro
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
