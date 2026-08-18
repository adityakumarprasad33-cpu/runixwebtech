import { ReactNode } from "react";
import { AuthHeroProvider } from "@/components/auth/AuthHeroContext";
import { Hero3DAuth } from "@/components/auth/Hero3DAuth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Runix | Authentication",
  description: "Secure authentication gateway for the Runix ecosystem.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthHeroProvider>
      <div className="min-h-screen w-full flex flex-col bg-[#050505] text-white selection:bg-white selection:text-black">
        {/* Main Split Panels */}
        <div className="flex-1 flex flex-col lg:flex-row w-full relative">
          {/* LEFT: Auth Form Panel (40-45%) */}
          <div className="w-full lg:w-[45%] xl:w-[42%] flex flex-col relative z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
            {children}
          </div>

          {/* RIGHT: 3D Product Hero (55-60%) */}
          <div className="w-full h-[40vh] lg:h-auto lg:flex-1 relative z-10 lg:sticky lg:top-0">
            <Hero3DAuth />
          </div>
        </div>

        {/* Minimalist Auth Footer Strip */}
        <footer className="w-full border-t border-white/10 bg-[#070707] py-3.5 px-6 sm:px-12 relative z-30 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-500 font-medium">
          <div className="flex items-center flex-wrap gap-2 text-center sm:text-left">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block shrink-0" />
            <span className="text-zinc-300 font-semibold tracking-wide">@Runix Web Tech</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-zinc-400">
              Incorporated & Associated with <span className="text-white font-semibold">Runix AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
            <span>Main Web Division of Runix AI</span>
            <span className="text-zinc-700 hidden md:inline">|</span>
            <span className="hidden md:inline">© {new Date().getFullYear()} Runix. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </AuthHeroProvider>
  );
}

