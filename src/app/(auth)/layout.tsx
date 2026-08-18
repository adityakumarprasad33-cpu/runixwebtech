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
      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#050505]">
        {/* LEFT: Auth Form Panel (40-45%) */}
        <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col relative z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
          {children}
        </div>

        {/* RIGHT: 3D Product Hero (55-60%) */}
        <div className="w-full h-[40vh] lg:h-screen lg:flex-1 relative z-10 lg:sticky lg:top-0">
          <Hero3DAuth />
        </div>
      </div>
    </AuthHeroProvider>
  );
}
