"use client";

import React from "react";
import { RunixSkeleton } from "./RunixSkeleton";

/**
 * HeroSkeleton — Matches the exact geometry of RunixRealisticDeveloperHero
 * to ensure zero layout shift when the real hero reveals.
 */
export function HeroSkeleton() {
  return (
    <section
      className="relative w-full min-h-[82vh] lg:min-h-[86vh] flex items-center overflow-hidden z-10 bg-[#E8EAED]"
      aria-label="Loading hero content"
      aria-busy="true"
    >
      {/* Background Architectural Geometry Approximation */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {/* Right side desk/workstation placeholder silhouette */}
        <div className="hidden lg:block absolute right-12 bottom-0 w-[52%] h-[85%] rounded-tl-2xl bg-gradient-to-tr from-[rgba(17,19,23,0.04)] via-[rgba(17,19,23,0.02)] to-transparent" />
        <div className="hidden lg:block absolute right-24 bottom-24 w-[42%] h-[55%] rounded-xl bg-gradient-to-t from-[rgba(17,19,23,0.06)] to-transparent" />
      </div>

      {/* Content Container — Exactly matches RunixRealisticDeveloperHero padding and width */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-32 sm:pt-36 pb-16 lg:pb-20">
        <div className="max-w-xl lg:max-w-[490px]">
          {/* Category Tag Skeleton */}
          <div className="mb-4">
            <RunixSkeleton className="w-20 h-4 rounded-[4px]" />
          </div>

          {/* Master Headline Skeleton (2 lines, matching 64-74px Geist scale) */}
          <div className="mb-5 space-y-3">
            <RunixSkeleton className="h-11 sm:h-14 w-[85%] rounded-[6px]" />
            <RunixSkeleton className="h-11 sm:h-14 w-[98%] rounded-[6px]" />
          </div>

          {/* Supporting Copy Skeleton (2 lines, matching 16-17px line height) */}
          <div className="mb-8 space-y-2 max-w-[480px]">
            <RunixSkeleton className="h-4 w-full rounded-[4px]" />
            <RunixSkeleton className="h-4 w-4/5 rounded-[4px]" />
          </div>

          {/* CTAs Skeleton (8px radius, 46px height) */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <RunixSkeleton className="h-[46px] w-36 rounded-[8px] bg-[#D1D5DB]" />
            <RunixSkeleton className="h-[46px] w-32 rounded-[8px] bg-[#E5E7EB]" />
          </div>

          {/* Trust Strip Skeleton */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
            <RunixSkeleton className="h-3.5 w-24 rounded-[3px]" />
            <span className="w-px h-3 bg-[rgba(17,19,23,0.14)]" />
            <RunixSkeleton className="h-3.5 w-24 rounded-[3px]" />
            <span className="w-px h-3 bg-[rgba(17,19,23,0.14)]" />
            <RunixSkeleton className="h-3.5 w-24 rounded-[3px]" />
            <span className="w-px h-3 bg-[rgba(17,19,23,0.14)]" />
            <RunixSkeleton className="h-3.5 w-28 rounded-[3px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
