"use client";

import { ReactNode } from "react";
import { AuthHeroProvider, useAuthHero } from "@/components/auth/AuthHeroContext";
import { Hero3DAuth } from "@/components/auth/Hero3DAuth";
import { motion, AnimatePresence } from "framer-motion";

function AuthLayoutInner({ children }: { children: ReactNode }) {
  const { heroState } = useAuthHero();
  const isAuthenticating = heroState === "authenticating" || heroState === "success";

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#050505] text-white selection:bg-white selection:text-black overflow-x-hidden">
      {/* Main Split Panels */}
      <div className="flex-1 flex flex-col lg:flex-row w-full relative">
        
        {/* LEFT: Auth Form Panel (Desktop: side-panel; Mobile: full-screen, hidden only when authenticating) */}
        <div 
          className={`
            w-full lg:w-[45%] xl:w-[42%] flex flex-col relative z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)]
            ${isAuthenticating ? "hidden lg:flex" : "flex flex-1"}
          `}
        >
          {children}
        </div>

        {/* RIGHT: 3D Product Hero (Desktop: always visible side-panel; Mobile: full-screen independent canvas when authenticating) */}
        <div 
          className={`
            w-full relative z-10 lg:flex-1 lg:sticky lg:top-0
            ${isAuthenticating 
              ? "flex flex-col flex-1 w-full h-full min-h-[calc(100vh-70px)] justify-center items-center relative overflow-visible" 
              : "hidden lg:flex lg:h-auto overflow-hidden"
            }
          `}
        >
          {/* Mobile Processing Banner floating smoothly at top */}
          {isAuthenticating && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden absolute top-6 left-1/2 -translate-x-1/2 text-center z-30 pointer-events-none w-full px-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-1 shadow-lg backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                Authenticating Session
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Verifying secure credentials with Runix...</p>
            </motion.div>
          )}

          <Hero3DAuth />
        </div>
      </div>

      {/* Minimalist Auth Footer Strip */}
      <footer className="w-full border-t border-white/10 bg-[#070707] py-3 px-4 sm:px-12 relative z-30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 font-medium shrink-0">
        <div className="flex items-center flex-wrap justify-center sm:justify-start gap-2 text-center sm:text-left">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block shrink-0" />
          <span className="text-zinc-300 font-semibold tracking-wide text-[11px] sm:text-xs">@Runix Web Tech</span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="text-zinc-400 text-[11px] sm:text-xs">
            Incorporated & Associated with <span className="text-white font-semibold">Runix AI</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-zinc-500 text-[10px] sm:text-[11px]">
          <span>Main Web Division of Runix AI</span>
          <span className="text-zinc-700 hidden md:inline">|</span>
          <span className="hidden md:inline">© {new Date().getFullYear()} Runix. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthHeroProvider>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </AuthHeroProvider>
  );
}


