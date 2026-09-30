"use client";

import { useEffect, useImperativeHandle, useState } from "react";
import { motion, useAnimation, Variants } from "framer-motion";
import { useAuthHero } from "./AuthHeroContext";
import { Layers, Code2, Lock, Zap, Database, Activity, ShieldCheck, Server, UserCircle } from "lucide-react";
import { useReducedMotion } from "framer-motion";

export function Hero3DAuth() {
  const { heroState, heroHandleRef } = useAuthHero();
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimation();
  
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [animationState, setAnimationState] = useState<string>(heroState);

  useImperativeHandle(heroHandleRef, () => ({
    playSuccessSequence: async () => {
      setIsSuccess(true);
      
      // ── CINEMATIC SPARK SEQUENCE ──
      setAnimationState("sparkFly");
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      setAnimationState("sparkCompress");
      await new Promise((resolve) => setTimeout(resolve, 150));
      
      setAnimationState("burst");
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }));

  useEffect(() => {
    if (isSuccess) return;

    setAnimationState(heroState);

    if (heroState === "error") {
      const timer = setTimeout(() => {
        setAnimationState("idle");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [heroState, prefersReducedMotion, isSuccess]);

  // ─── MASTER SCENE VARIANTS ───
  // Rebalanced scales and deep Z-space for strong hierarchy
  const sceneVariants: Variants = {
    static: { rotateX: 15, rotateY: -15, rotateZ: 0, scale: 1 },
    idle: {
      rotateX: [15, 16, 14, 15],
      rotateY: [-15, -14, -16, -15],
      rotateZ: [0, 1, -1, 0],
      scale: 1,
      transition: { duration: 12, repeat: Infinity, ease: "easeInOut" }
    },
    focusEmail: { rotateX: 12, rotateY: -10, rotateZ: -1, scale: 1.02, transition: { duration: 1, ease: "easeOut" } },
    focusPassword: { rotateX: 18, rotateY: -20, rotateZ: 2, scale: 1.02, transition: { duration: 1, ease: "easeOut" } },
    authenticating: { rotateX: 15, rotateY: -15, rotateZ: 0, scale: 1.02, transition: { duration: 1.5, ease: "easeInOut" } },
    error: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.5 } },
    burst: { rotateX: 5, rotateY: -5, rotateZ: 0, scale: 1.1, transition: { duration: 1.2, ease: "circOut" } }
  };

  // ─── LAYER 1: BLUEPRINT (z: -300) ───
  const layer1Variants: Variants = {
    idle: { y: 160, z: -300, scale: 1.15, opacity: 0.6 },
    focusPassword: { y: 160, z: -320, opacity: 0.8 },
    authenticating: { y: 160, z: -300, scale: 1.15, opacity: 1, transition: { delay: 0 } },
    burst: { y: 260, z: -400, opacity: 0 }
  };

  // ─── LAYER 2: TERMINAL (z: -150) ───
  const layer2Variants: Variants = {
    idle: { x: -140, y: 70, z: -150, opacity: 0.85 },
    focusPassword: { x: -120, y: 70, z: -100, opacity: 1 },
    authenticating: { x: -140, y: 70, z: -150, opacity: 1, transition: { delay: 0.1 } },
    burst: { x: -220, y: 140, z: -250, opacity: 0 }
  };

  // ─── LAYER 3: METRICS (z: -50) ───
  const layer3Variants: Variants = {
    idle: { x: 130, y: 15, z: -50, opacity: 0.85 },
    focusEmail: { x: 110, y: 15, z: -20, opacity: 1 },
    authenticating: { x: 130, y: 15, z: -50, opacity: 1, transition: { delay: 0.2 } },
    burst: { x: 220, y: 45, z: -150, opacity: 0 }
  };

  // ─── LAYER 3b: WAVE GRAPH (z: -100) ───
  const graphLayerVariants: Variants = {
    idle: { x: 0, y: -90, z: -100, opacity: 0.35 },
    authenticating: { x: 0, y: -90, z: -100, opacity: 0.9, transition: { delay: 0.3 } },
    burst: { opacity: 0 }
  };

  // ─── LAYER 4: BROWSER (z: 50) - Focal Point ───
  const layer4Variants: Variants = {
    idle: { y: -20, z: 50, scale: 0.9, opacity: 0.95 },
    focusEmail: { y: -10, z: 80, scale: 0.92, opacity: 1 },
    authenticating: { y: -20, z: 50, scale: 0.9, opacity: 1, transition: { delay: 0.4 } },
    burst: { y: 0, z: 150, scale: 1.05, opacity: 1 }
  };

  // ─── LAYER 5: TRUST INDICATORS (z: 100) ───
  const layer5Variants: Variants = {
    idle: { y: 155, z: 80, scale: 0.9, opacity: 0.7 },
    focusEmail: { y: 165, z: 100, scale: 0.95, opacity: 1 },
    focusPassword: { y: 165, z: 100, scale: 0.95, opacity: 1 },
    authenticating: { y: 155, z: 80, scale: 0.9, opacity: 1, transition: { delay: 0.5 } },
    burst: { y: 210, z: 200, scale: 1.1, opacity: 0 }
  };

  // ─── SECURITY PATHS (z: 0) ───
  const securityPathVariants: Variants = {
    idle: { opacity: 0.1 },
    authenticating: { opacity: 0.6, transition: { delay: 0.5 } },
    burst: { opacity: 0 }
  };

  // ─── SPARK & BURST (Success Sequence) ───
  const sparkVariants: Variants = {
    idle: { opacity: 0, x: "200%", y: "-200%", scale: 0, filter: "blur(4px)" },
    sparkFly: { 
      opacity: [0, 1, 1], 
      x: ["200%", "50%", "0%"], 
      y: ["-200%", "-50%", "0%"], 
      scale: [0.5, 2, 1],
      filter: ["blur(4px)", "blur(2px)", "blur(0px)"],
      transition: { duration: 0.6, ease: "easeIn" } 
    },
    sparkCompress: { scale: 0.1, filter: "blur(0px)", transition: { duration: 0.15, ease: "easeOut" } },
    burst: { opacity: 0, scale: 0, transition: { duration: 0.05 } }
  };

  const burstVariants: Variants = {
    idle: { opacity: 0, scale: 0 },
    burst: { 
      opacity: [1, 1, 0], 
      scale: [0.1, 4, 6], 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] lg:min-h-screen flex items-center justify-center overflow-visible bg-[#E5E7EB]">
      {/* Background Ambient Lighting */}
      <motion.div
        variants={{
          idle: { opacity: 0.3, scale: 1 },
          authenticating: { opacity: 0.7, scale: 1.2, transition: { duration: 2 } },
          burst: { opacity: 0.9, scale: 1.8, background: "rgba(50, 107, 255, 0.20)" }
        }}
        initial="idle"
        animate={animationState}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[900px] h-[80vh] bg-[#315EF7]/10 blur-[120px] rounded-full pointer-events-none"
      />

      {/* 3D Scene Canvas */}
      <div className="w-full h-full relative [perspective:1400px] sm:[perspective:1600px] flex items-center justify-center pointer-events-none overflow-visible">
        <motion.div
          variants={sceneVariants}
          initial="idle"
          animate={animationState}
          className="relative w-full max-w-[780px] h-[400px] sm:h-[460px] lg:h-[500px] transform-style-preserve-3d flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* ─── LAYER 1: BLUEPRINT ─── */}
          <motion.div
            variants={layer1Variants}
            className="absolute inset-2 sm:inset-0 rounded-xl bg-[#FAFAFA] border border-[rgba(21,24,29,0.10)] backdrop-blur-sm p-6 shadow-[0_20px_50px_rgba(21,24,29,0.06)] overflow-hidden"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="absolute inset-0 bg-grid opacity-25" />
            
            {/* Authenticating Scan Line */}
            <motion.div 
              variants={{
                idle: { opacity: 0, y: "-100%" },
                authenticating: { opacity: 0.5, y: ["-100%", "200%"], transition: { duration: 2, repeat: Infinity, ease: "linear", delay: 0 } }
              }}
              className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[#315EF7]/15 to-transparent blur-md"
            />

            <div className="grid grid-cols-4 gap-4 relative z-10 my-auto h-full items-end opacity-70">
              {[Database, Lock, Server, Layers].map((Icon, i) => (
                <div key={i} className="h-16 rounded-xl border border-[rgba(21,24,29,0.10)] bg-[#FFFFFF] flex flex-col justify-center items-center shadow-xs">
                  <Icon className="w-4 h-4 text-[#4B5563] mb-2" />
                  <motion.div 
                    variants={{
                      idle: { width: "20%", backgroundColor: "rgba(21, 24, 29, 0.15)" },
                      authenticating: { width: "80%", backgroundColor: "rgba(50, 107, 255, 0.7)", transition: { delay: i * 0.1 } }
                    }}
                    className="h-1 rounded-full"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── LAYER 2: TERMINAL ─── */}
          <motion.div
            variants={layer2Variants}
            className="absolute left-1/4 top-1/4 w-64 rounded-xl bg-[#111317] border border-[rgba(21,24,29,0.20)] shadow-[0_20px_40px_rgba(21,24,29,0.14)] overflow-hidden"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="h-6 bg-[#0E1013] border-b border-white/10 px-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              </div>
              <Code2 className="w-3 h-3 text-zinc-500" />
            </div>
            <div className="p-4 font-mono text-[10px] leading-relaxed relative min-h-[100px]">
              {/* Idle State Text */}
              <motion.div variants={{ idle: { opacity: 1 }, authenticating: { opacity: 0 } }} className="absolute inset-0 p-4 text-zinc-300">
                <p><span className="text-[#315EF7]">import</span> <span className="text-white">{"{ auth }"}</span> <span className="text-[#315EF7]">from</span> <span className="text-[#169B62]">'@runix/core'</span>;</p>
                <p className="mt-2 text-zinc-500">// awaiting connection...</p>
              </motion.div>
              
              {/* Authenticating State Text */}
              <motion.div variants={{ idle: { opacity: 0, display: "none" }, authenticating: { opacity: 1, display: "block" } }} className="absolute inset-0 p-4">
                <motion.p variants={{ idle: { opacity: 0 }, authenticating: { opacity: 1, transition: { delay: 0.1 } } }} className="text-zinc-200"><span className="text-[#315EF7]">&gt;</span> Authenticating session...</motion.p>
              </motion.div>
            </div>
          </motion.div>

          {/* ─── LAYER 3: METRICS ─── */}
          <motion.div
            variants={layer3Variants}
            className="absolute right-1/4 top-12 w-52 flex flex-col gap-3"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Metric 1 */}
            <div className="rounded-xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] p-3 shadow-[0_15px_30px_rgba(21,24,29,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#111317] tracking-wider font-mono">AUTH STATUS</span>
                <motion.span 
                  variants={{ idle: { backgroundColor: "#6B7280" }, authenticating: { backgroundColor: "#169B62", transition: { delay: 0.2 } } }} 
                  className="w-1.5 h-1.5 rounded-full" 
                />
              </div>
              <motion.div 
                variants={{ idle: { opacity: 0 }, authenticating: { opacity: 1, transition: { delay: 0.2 } } }}
                className="text-[10px] text-[#4B5563] font-mono flex items-center gap-1"
              >
                Processing <span className="animate-pulse">...</span>
              </motion.div>
            </div>

            {/* Metric 2 */}
            <div className="rounded-xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] p-3 shadow-[0_10px_20px_rgba(21,24,29,0.04)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#315EF7]" />
                  <span className="text-[10px] font-bold text-[#111317]">Security</span>
                </div>
                <motion.span 
                  variants={{ idle: { opacity: 0 }, authenticating: { opacity: 1, transition: { delay: 0.4 } } }}
                  className="text-[9px] text-[#315EF7] font-mono font-bold"
                >
                  ACTIVE
                </motion.span>
              </div>
            </div>
          </motion.div>

          {/* ─── LAYER 3b: WAVE GRAPH ─── */}
          <motion.div variants={graphLayerVariants} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-32 flex items-center justify-center pointer-events-none opacity-40">
            <svg viewBox="0 0 400 100" className="w-[120%] h-full">
              <motion.path 
                d="M0,50 Q40,10 80,50 T160,50 T240,50 T320,50 T400,50" 
                fill="none" 
                stroke="#315EF7" 
                strokeWidth="2"
                variants={{
                  idle: { d: "M0,50 Q40,40 80,50 T160,50 T240,50 T320,50 T400,50" },
                  authenticating: { 
                    d: [
                      "M0,50 Q40,10 80,50 T160,50 T240,50 T320,50 T400,50",
                      "M0,50 Q40,90 80,50 T160,50 T240,50 T320,50 T400,50",
                      "M0,50 Q40,10 80,50 T160,50 T240,50 T320,50 T400,50"
                    ],
                    transition: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
                  }
                }}
              />
            </svg>
          </motion.div>

          {/* ─── SECURITY PATHS ─── */}
          <motion.div variants={securityPathVariants} className="absolute inset-0 pointer-events-none">
             {/* Subtle lines connecting layers conceptually */}
             <div className="absolute top-[30%] left-[35%] w-[30%] h-[1px] bg-gradient-to-r from-transparent via-[#315EF7]/40 to-transparent rotate-12 blur-[1px]" />
             <div className="absolute top-[60%] right-[30%] w-[20%] h-[1px] bg-gradient-to-r from-transparent via-[#315EF7]/30 to-transparent -rotate-12 blur-[1px]" />
          </motion.div>

          {/* ─── LAYER 4: BROWSER (Focal Point) ─── */}
          <motion.div
            variants={layer4Variants}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[500px] h-64 rounded-2xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.12)] shadow-[0_30px_70px_rgba(21,24,29,0.08)] flex flex-col overflow-hidden"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="h-9 bg-[#FAFAFA] border-b border-[rgba(21,24,29,0.08)] px-4 flex items-center justify-between">
              <div className="w-8" /> {/* Spacer */}
              <div className="bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] rounded-full px-4 py-1 text-[10px] font-mono text-[#4B5563] flex items-center gap-2 shadow-xs">
                <Lock className="w-2.5 h-2.5 text-[#169B62]" />
                auth.runix.tech
              </div>
              <div className="w-8" /> {/* Spacer */}
            </div>
            
            <div className="flex-1 p-6 bg-[#FFFFFF] relative overflow-hidden flex flex-col justify-center">
              <div className="relative z-10 w-full max-w-[320px] mx-auto">
                <h3 className=" text-lg font-bold text-[#111317] mb-4 tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#315EF7]" />
                  Authentication Pipeline
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Pipeline Cards */}
                  <PipelineCard 
                    icon={UserCircle} 
                    title="IDENTITY" 
                    subtitle="Authentication" 
                  />
                  <PipelineCard 
                    icon={ShieldCheck} 
                    title="SECURITY" 
                    subtitle="Protected session" 
                  />
                  <PipelineCard 
                    icon={Server} 
                    title="DATA" 
                    subtitle="State Sync" 
                  />
                  <PipelineCard 
                    icon={Layers} 
                    title="RUNTIME" 
                    subtitle="Application access" 
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── LAYER 5: TRUST INDICATORS ─── */}
          <motion.div
            variants={layer5Variants}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[500px] flex justify-center gap-4 md:gap-6 pointer-events-none"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] shadow-[0_10px_25px_rgba(21,24,29,0.05)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#169B62]" />
              <span className="text-[10px] font-bold text-[#111317] tracking-wider font-mono">SOC2 VERIFIED</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] shadow-[0_10px_25px_rgba(21,24,29,0.05)]">
              <Lock className="w-3.5 h-3.5 text-[#315EF7]" />
              <span className="text-[10px] font-bold text-[#111317] tracking-wider font-mono">AES-256</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] shadow-[0_10px_25px_rgba(21,24,29,0.05)]">
              <Zap className="w-3.5 h-3.5 text-[#B77900]" />
              <span className="text-[10px] font-bold text-[#111317] tracking-wider font-mono">99.99% UPTIME</span>
            </div>
          </motion.div>

          {/* ─── SUCCESS SEQUENCE: SPARK & BURST ─── */}
          <motion.div
            variants={sparkVariants}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="w-2 h-2 bg-[#315EF7] rounded-full shadow-[0_0_10px_2px_#315EF7]" />
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-16 h-[2px] bg-gradient-to-r from-[#315EF7] to-transparent blur-[1px]" />
          </motion.div>

          {/* Organic Irregular Plasma Burst */}
          <motion.div
            variants={burstVariants}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="absolute w-24 h-24 bg-[#315EF7]/30 rounded-full blur-[16px]" />
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

// ─── HELPER COMPONENT FOR PIPELINE CARDS ───
function PipelineCard({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) {
  return (
    <div className="bg-[#FAFAFA] border border-[rgba(21,24,29,0.08)] rounded-xl p-2.5 flex flex-col justify-center relative overflow-hidden">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3 h-3 text-[#315EF7]" />
        <span className="text-[9px] font-bold text-[#111317] tracking-wider font-mono">{title}</span>
      </div>
      <div className="text-[9px] text-[#6B7280] font-mono">
        {subtitle}
      </div>
    </div>
  );
}
