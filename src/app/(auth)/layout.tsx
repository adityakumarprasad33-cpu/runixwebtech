"use client";

import { ReactNode, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HERO_MANIFEST } from "@/lib/hero-manifest";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Route-specific unique hero asset determination
  const isSignup =
    pathname === "/signup" ||
    pathname === "/register" ||
    pathname === "/verify-email";

  const heroImage = isSignup ? HERO_MANIFEST.signup : HERO_MANIFEST.login;
  const heroTitle = isSignup
    ? "Start building with Runix."
    : "Built for the people building what's next.";
  const heroCaption = isSignup
    ? "The software engineering studio for ambitious founders."
    : "Designed, built and launched by Runix.";
  const heroAlt = isSignup
    ? "Runix software founders and architects collaborating in studio workspace"
    : "Runix product engineer building digital platforms at studio workstation";

  // Fixed desktop viewport shell lock:
  // On desktop (>= 1024px), ensure document.body does not scroll.
  // Only the right-hand form column (#auth-form-column) may scroll.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      } else {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#FFFFFF] text-[#111317] antialiased selection:bg-[#315EF7]/15 selection:text-[#111317]">
      <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[45%_55%] xl:grid-cols-[46%_54%] lg:overflow-hidden">
        {/* LEFT COLUMN: Fixed Visual Panel (Desktop Only — Never Scrolls) */}
        <aside
          aria-label="Runix Visual Workspace"
          className="hidden lg:block relative h-full w-full overflow-hidden bg-[#16181D] select-none"
        >
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="object-cover object-center brightness-[0.92] contrast-[1.04]"
          />

          {/* Atmospheric gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111317]/85 via-transparent to-[#111317]/35 pointer-events-none" />

          {/* Top brand badge */}
          <div className="absolute top-8 left-8 z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white transition-all group"
            >
              <div className="relative w-5 h-5 shrink-0">
                <Image
                  src="/logo-v2.png"
                  alt="Runix"
                  fill
                  sizes="20px"
                  className="object-contain brightness-0 invert"
                />
              </div>
              <span className="text-xs font-semibold tracking-tight text-white">Runix</span>
            </Link>
          </div>

          {/* Bottom Editorial Caption */}
          <div className="absolute bottom-10 left-8 right-8 z-10 max-w-lg">
            <p className="text-2xl font-semibold text-white tracking-tight leading-snug">
              {heroTitle}
            </p>
            <p className="mt-2 text-xs text-white/70 font-medium tracking-wide">
              {heroCaption}
            </p>
          </div>
        </aside>

        {/* RIGHT COLUMN: Dedicated Scrollable Form Shell */}
        <div
          id="auth-form-column"
          className="auth-scroll relative h-full w-full overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] bg-[#FFFFFF] border-l border-[rgba(17,19,23,0.06)] flex flex-col items-center px-6 py-6 sm:px-12 lg:px-16"
        >
          <div className="w-full max-w-[420px] my-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
