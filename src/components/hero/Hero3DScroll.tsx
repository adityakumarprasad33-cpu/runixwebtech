"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import {
  ArrowRight,
  Award,
  ShieldCheck,
  Zap,
  Layers,
  Code2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Hero3DScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Hook scroll progress for the 280vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth scroll spring physics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 95,
    damping: 25,
    restDelta: 0.001,
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 1. LEFT HERO CONTENT (0.00 -> 0.20 STABLE, 0.20 -> 0.42 EXITS UPWARD)
  // ═════════════════════════════════════════════════════════════════════════
  const leftColY = useTransform(smoothProgress, [0, 0.20, 0.42], [0, 0, -130]);
  const leftColOpacity = useTransform(smoothProgress, [0, 0.20, 0.38], [1, 1, 0]);



  // ═════════════════════════════════════════════════════════════════════════
  // 5. 3D SCENE CENTERING: UNLOCKED BY BURST (0.46 -> 0.56 TO CENTER)
  // ═════════════════════════════════════════════════════════════════════════
  // Stays at 72% on right during initial & flight, glides to 50% only after burst
  const sceneLeft = useTransform(
    smoothProgress,
    [0, 0.20, 0.45, 0.55, 1],
    [isDesktop ? "65%" : "50%", isDesktop ? "65%" : "50%", isDesktop ? "65%" : "50%", "50%", "50%"]
  );
  const sceneReleaseY = useTransform(smoothProgress, [0, 0.91, 0.96, 1], [0, 0, 50, 220]);

  // 3D Perspective Rotation & Overall Scale
  const rotateX = useTransform(smoothProgress, [0, 0.20, 0.52, 0.70, 0.85, 0.95, 1], [16, 16, 26, 26, 8, 0, 0]);
  const rotateY = useTransform(smoothProgress, [0, 0.20, 0.52, 0.70, 0.85, 0.95, 1], [-12, -12, -18, -18, -4, 0, 0]);
  const rotateZ = useTransform(smoothProgress, [0, 0.20, 0.52, 0.70, 0.85, 0.95, 1], [3, 3, 5, 5, 1, 0, 0]);
  const overallScale = useTransform(smoothProgress, [0, 0.20, 0.45, 0.56, 0.85, 0.95, 1], [0.88, 0.88, 0.88, 1.0, 1.04, 1.0, 0.98]);

  // 3D Scene Opacity: on mobile hidden (0) until text disappears on scroll (0.28 -> 0.42), desktop always 1
  const sceneOpacity = useTransform(
    smoothProgress,
    [0, 0.25, 0.42, 0.95, 1],
    [isDesktop ? 1 : 0, isDesktop ? 1 : 0, 1, 1, 0.8]
  );

  // ═════════════════════════════════════════════════════════════════════════
  // 6. CENTER-AXIS EXPLODED 3D LAYERS (0.55 -> 0.80 AFTER BURST REVEAL)
  // ═════════════════════════════════════════════════════════════════════════
  // Layer 1: Holographic Blueprint Grid (Bottom Center)
  const layer1Y = useTransform(smoothProgress, [0, 0.54, 0.66, 0.76, 0.85, 1], [0, 0, 85, 85, 0, 0]);
  const layer1Z = useTransform(smoothProgress, [0, 0.54, 0.66, 0.76, 0.85, 1], [0, 0, -120, -120, 0, 0]);
  const layer1Opacity = useTransform(smoothProgress, [0, 0.52, 0.60, 0.76, 0.85, 1], [0.15, 0.2, 1, 1, 0.15, 0]);

  // Layer 2: Code Engine Terminal (Middle Left of center axis)
  const layer2X = useTransform(smoothProgress, [0, 0.54, 0.66, 0.76, 0.85, 1], [0, 0, -145, -145, 0, 0]);
  const layer2Y = useTransform(smoothProgress, [0, 0.54, 0.66, 0.76, 0.85, 1], [0, 0, 25, 25, 0, 0]);
  const layer2Z = useTransform(smoothProgress, [0, 0.54, 0.66, 0.76, 0.85, 1], [0, 0, -35, -35, 0, 0]);
  const layer2Opacity = useTransform(smoothProgress, [0, 0.52, 0.60, 0.76, 0.85, 1], [0, 0.2, 1, 1, 0.2, 0]);

  // Layer 3: UI Metrics & Conversion Wave Graph (Middle Right of center axis)
  const layer3X = useTransform(smoothProgress, [0, 0.54, 0.66, 0.76, 0.85, 1], [0, 0, 145, 145, 0, 0]);
  const layer3Y = useTransform(smoothProgress, [0, 0.54, 0.66, 0.76, 0.85, 1], [0, 0, -25, -25, 0, 0]);
  const layer3Z = useTransform(smoothProgress, [0, 0.54, 0.66, 0.76, 0.85, 1], [0, 0, 45, 45, 0, 0]);
  const layer3Opacity = useTransform(smoothProgress, [0, 0.52, 0.60, 0.76, 0.85, 1], [0, 0.2, 1, 1, 0.2, 0]);

  // Layer 4: Top Assembled Browser Frame (Top Center)
  const layer4Y = useTransform(smoothProgress, [0, 0.54, 0.66, 0.76, 0.85, 1], [0, 0, -80, -80, 0, 0]);
  const layer4Z = useTransform(smoothProgress, [0, 0.54, 0.66, 0.76, 0.85, 1], [0, 0, 105, 105, 0, 0]);

  return (
    <div ref={containerRef} className="relative w-full h-[280vh]">
      {/* Sticky Full-Viewport Container */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center pt-20 pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden z-10">
        
        {/* Background Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] max-w-[700px] h-[50vh] bg-indigo-600/8 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* ── MAX-WIDTH 7XL VIEWPORT CANVAS ── */}
        <div className="w-full max-w-7xl mx-auto relative h-full flex items-center justify-center">
          
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* LEFT HERO CONTENT: TYPOGRAPHY, CTAS, TRUST BAR */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <motion.div
            style={{
              y: leftColY,
              opacity: leftColOpacity,
            }}
            className="absolute left-0 right-0 lg:right-auto mx-auto lg:mx-0 w-full max-w-lg lg:max-w-xl flex flex-col justify-center text-center lg:text-left z-20 pointer-events-auto px-2 sm:px-0"
          >
            {/* Main Headline */}
            <h1 className="font-jakarta text-5xl sm:text-6xl md:text-7xl lg:text-[4.5rem] text-white tracking-tighter mb-6 leading-[0.88] font-black uppercase">
              Digital<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                Engineering
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-zinc-400 max-w-md mx-auto lg:mx-0 mb-8 font-medium leading-relaxed tracking-tight">
              We design and build bespoke websites, high-velocity web platforms, and custom dashboards engineered to scale your digital presence.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10">
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="accent"
                  className="h-14 px-8 text-base rounded-full shadow-lg hover:shadow-xl font-bold"
                >
                  Start Your Project <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/work">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-7 text-base border-white/20 hover:border-white/40 rounded-full font-bold"
                >
                  Explore Works
                </Button>
              </Link>
            </div>

          </motion.div>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* COMPLETE 3D SCENE WRAPPER (CENTERED BOUNDING BOX) */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <motion.div
            style={{
              left: sceneLeft,
              top: "50%",
              x: "-50%",
              y: "-50%",
              translateY: sceneReleaseY,
              rotateX,
              rotateY,
              rotateZ,
              scale: overallScale,
              opacity: sceneOpacity,
              transformStyle: "preserve-3d",
            }}
            className="absolute w-[92vw] max-w-[580px] md:max-w-[640px] xl:max-w-[720px] aspect-[16/10] [perspective:1400px] flex items-center justify-center z-15 pointer-events-none"
          >


            {/* ───────────────────────────────────────────────────────────── */}
            {/* LAYER 1: HOLOGRAPHIC BLUEPRINT WIREFRAME GRID (BOTTOM CENTER) */}
            {/* ───────────────────────────────────────────────────────────── */}
            <motion.div
              style={{
                y: layer1Y,
                z: layer1Z,
                opacity: layer1Opacity,
                transformStyle: "preserve-3d",
              }}
              className="absolute inset-0 rounded-3xl bg-zinc-900/30 border border-white/8 backdrop-blur-sm p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.6)] pointer-events-none"
            >
              {/* Blueprint Grid Lines */}
              <div className="absolute inset-0 bg-grid opacity-25 rounded-3xl" />

              {/* Wireframe Structural Blocks */}
              <div className="grid grid-cols-3 gap-3 relative z-10 my-auto opacity-60">
                <div className="h-14 rounded-xl border border-white/8 bg-white/[0.02] flex flex-col justify-center items-center p-2 text-center">
                  <DatabaseIcon className="w-3.5 h-3.5 text-zinc-400 mb-1" />
                  <span className="text-[9px] font-mono text-zinc-400">Database</span>
                </div>
                <div className="h-14 rounded-xl border border-white/8 bg-white/[0.02] flex flex-col justify-center items-center p-2 text-center">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 mb-1" />
                  <span className="text-[9px] font-mono text-zinc-400">Auth</span>
                </div>
                <div className="h-14 rounded-xl border border-white/8 bg-white/[0.02] flex flex-col justify-center items-center p-2 text-center">
                  <Layers className="w-3.5 h-3.5 text-zinc-400 mb-1" />
                  <span className="text-[9px] font-mono text-zinc-400">Edge CDN</span>
                </div>
              </div>
            </motion.div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* LAYER 2: CODE ENGINE TERMINAL (MIDDLE-LEFT OF CENTER AXIS) */}
            {/* ───────────────────────────────────────────────────────────── */}
            <motion.div
              style={{
                x: layer2X,
                y: layer2Y,
                z: layer2Z,
                opacity: layer2Opacity,
                transformStyle: "preserve-3d",
              }}
              className="absolute left-0 top-1/4 w-60 sm:w-68 rounded-2xl bg-[#0a0a0c]/90 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden z-20 pointer-events-none"
            >
              {/* Terminal Title Bar */}
              <div className="h-8 bg-white/5 border-b border-white/10 px-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                  <Code2 className="w-3 h-3 text-indigo-400" />
                  <span>Architecture.ts</span>
                </div>
                <span className="text-[9px] font-mono text-indigo-400 font-bold">SYS</span>
              </div>

              {/* Code Snippet */}
              <div className="p-3 font-mono text-[10px] leading-relaxed text-zinc-300">
                <p className="text-purple-400 font-semibold">Runix System Architecture</p>
                <p className="mt-2 text-zinc-400">
                  <span className="text-emerald-400">├──</span> Frontend Experience
                </p>
                <p className="pl-3 text-zinc-400">
                  <span className="text-emerald-400">├──</span> Data Infrastructure
                </p>
                <p className="pl-3 text-zinc-400">
                  <span className="text-emerald-400">└──</span> Authentication
                </p>
              </div>
            </motion.div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* LAYER 3: UI COMPONENT DECK (MIDDLE-RIGHT OF CENTER AXIS) */}
            {/* ───────────────────────────────────────────────────────────── */}
            <motion.div
              style={{
                x: layer3X,
                y: layer3Y,
                z: layer3Z,
                opacity: layer3Opacity,
                transformStyle: "preserve-3d",
              }}
              className="absolute right-0 top-8 sm:top-10 w-56 sm:w-60 flex flex-col gap-2.5 z-30 pointer-events-none"
            >
              {/* Metric Card 1: Conversion Wave Graph */}
              <div className="rounded-2xl bg-[#0c0c10]/95 border border-white/10 backdrop-blur-2xl p-3.5 shadow-[0_15px_40px_rgba(0,0,0,0.85)]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-bold text-white">Conversion Velocity</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    +42.8%
                  </span>
                </div>
                {/* Glowing Wave SVG */}
                <div className="h-10 w-full pt-1">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" fill="none">
                    <defs>
                      <linearGradient id="gradWavePrecision2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 25 Q 15 5, 30 18 T 60 8 T 85 14 T 100 2"
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 25 Q 15 5, 30 18 T 60 8 T 85 14 T 100 2 L 100 30 L 0 30 Z"
                      fill="url(#gradWavePrecision2)"
                    />
                  </svg>
                </div>
              </div>

              {/* Metric Card 2: Interactive Token Badge */}
              <div className="rounded-xl bg-[#0f0f14]/90 border border-white/10 backdrop-blur-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Zap className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white">V16 Turbo Engine</p>
                    <p className="text-[9px] text-zinc-400">Sub-50ms Response</p>
                  </div>
                </div>
                <Zap className="w-3.5 h-3.5 text-zinc-500" />
              </div>
            </motion.div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* LAYER 4: ASSEMBLED BROWSER INTERFACE SHELL (TOP CENTER) */}
            {/* ───────────────────────────────────────────────────────────── */}
            <motion.div
              style={{
                y: layer4Y,
                z: layer4Z,
                transformStyle: "preserve-3d",
              }}
              className="absolute inset-0 rounded-3xl bg-[#08080a]/95 border border-white/12 backdrop-blur-3xl shadow-[0_30px_80px_rgba(0,0,0,0.95),0_8px_30px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden z-40"
            >
              {/* Browser Window Header */}
              <div className="h-10 bg-zinc-900/90 border-b border-white/10 px-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                
                {/* URL Search Pill */}
                <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-full px-3 py-0.5 max-w-[200px] w-full justify-center text-[11px] font-mono text-zinc-400">
                  <Lock className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-zinc-200">runix.tech</span>
                  <span className="text-zinc-500">/build</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">LIVE</span>
                </div>
              </div>

              {/* Browser Body Mockup Content */}
              <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-b from-[#0e0e12] to-[#060608] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

                {/* Inner Mockup Navigation Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center font-bold text-black text-[10px] font-jakarta">
                      R
                    </div>
                    <span className="font-jakarta font-bold text-xs text-white">Runix Product</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-zinc-400">
                    <span className="text-white font-semibold">Features</span>
                    <span>Architecture</span>
                    <span>Pricing</span>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[9px] font-bold text-indigo-300">
                    Production Build
                  </div>
                </div>

                {/* Inner Hero Showcase */}
                <div className="my-auto py-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-semibold text-zinc-300 mb-2">
                    <Zap className="w-2.5 h-2.5 text-indigo-400" /> High-Concurrence UI Architecture
                  </div>
                  <h3 className="font-jakarta text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                    Custom Web Applications & <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                      High-Velocity Interfaces
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400 max-w-sm mt-1 font-medium leading-relaxed">
                    Engineered with sub-second response times, modular design tokens, and real-time cloud synchronization.
                  </p>
                </div>

                {/* Inner Bottom Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-white/5">
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Lighthouse</p>
                    <p className="text-xs font-black text-emerald-400 font-jakarta">100 / 100</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Framework</p>
                    <p className="text-xs font-black text-white font-jakarta">Next.js 16</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Styling</p>
                    <p className="text-xs font-black text-indigo-300 font-jakarta">Tailwind v4</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Security</p>
                    <p className="text-xs font-black text-purple-300 font-jakarta">Encrypted</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>



        </div>

      </div>
    </div>
  );
}

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  );
}
