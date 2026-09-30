"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  HERO_SLIDES,
  DEDICATED_HEROES,
  type RunixHeroPage,
} from "@/lib/hero-scenes";

import {
  preloadAndDecodeImage,
  markAssetCached,
} from "@/lib/readiness/page-readiness";

interface RunixRealisticDeveloperHeroProps {
  page?: RunixHeroPage;
}

export default function RunixRealisticDeveloperHero({
  page = "home",
}: RunixRealisticDeveloperHeroProps) {
  const isHome = page === "home";
  const [slideIndex, setSlideIndex] = useState(0);

  const activeSlide = isHome ? HERO_SLIDES[slideIndex] : null;
  const dedicatedConfig = !isHome
    ? DEDICATED_HEROES[page as Exclude<RunixHeroPage, "home">]
    : null;

  // Active slide content
  const tag = isHome ? activeSlide!.tag : dedicatedConfig!.tag;
  const titleLines = isHome
    ? activeSlide!.titleLines
    : dedicatedConfig!.titleLines;
  const supporting = isHome
    ? activeSlide!.supporting
    : dedicatedConfig!.supporting;
  const primaryCta = isHome
    ? activeSlide!.primaryCta
    : dedicatedConfig!.primaryCta;
  const secondaryCta = isHome
    ? activeSlide!.secondaryCta
    : dedicatedConfig!.secondaryCta;
  const currentImageSrc = isHome
    ? activeSlide!.imageSrc
    : dedicatedConfig!.imageSrc;
  const currentAlt = isHome ? activeSlide!.alt : dedicatedConfig!.alt;

  // Sequential Next-Slide Preloader (Requirement 17):
  // When current slide i is active, preload next slide (i + 1) % 5
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isHome) {
      // Mark current slide as verified in cache
      markAssetCached(HERO_SLIDES[slideIndex].imageSrc);

      // Preload immediate next slide in background
      const nextIdx = (slideIndex + 1) % HERO_SLIDES.length;
      const nextSrc = HERO_SLIDES[nextIdx].imageSrc;
      preloadAndDecodeImage(nextSrc, 4000).catch(() => {});
    } else if (dedicatedConfig?.imageSrc) {
      markAssetCached(dedicatedConfig.imageSrc);
    }
  }, [isHome, slideIndex, dedicatedConfig]);

  // 3-Second automatic continuous slideshow loop for Homepage
  useEffect(() => {
    if (!isHome) return;

    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isHome]);

  return (
    <section
      className="relative w-full min-h-[82vh] lg:min-h-[86vh] flex items-center overflow-hidden z-10 bg-[#E8EAED]"
      aria-label={titleLines.join(" ")}
    >
      {/* ── FULL-BLEED PHOTOGRAPHIC HERO ASSET (NO WASHED OUT OVERLAY) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {isHome ? (
          <AnimatePresence initial={false}>
            <motion.div
              key={activeSlide!.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImageSrc}
                alt={currentAlt}
                className="w-full h-full object-cover object-[72%_center] sm:object-[70%_center] lg:object-[68%_center]"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImageSrc}
              alt={currentAlt}
              className="w-full h-full object-cover object-[72%_center] sm:object-[70%_center] lg:object-[68%_center]"
            />
          </div>
        )}

        {/* 
          CRITICAL VISUAL CORRECTION: 
          No full-hero white wash overlay! The photograph remains rich, dimensional, 
          contrasty, and detailed. 
          Only a minimal, soft local gradient behind the text area on small screens 
          where the viewport is narrow.
        */}
        <div className="md:hidden absolute inset-0 z-[3] pointer-events-none bg-gradient-to-b from-white/70 via-white/20 to-transparent" />
      </div>

      {/* ── HERO CONTENT OVERLAY (Composed Left 45% Zone) ── */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-32 sm:pt-36 pb-16 lg:pb-20">
        <div className="max-w-xl lg:max-w-[490px]">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isHome ? activeSlide!.id : page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Category Tag */}
              <div className="mb-4">
                <span className="section-label">
                  {tag}
                </span>
              </div>

              {/* Master Headline: Geist Sans, weight 600-650, ~64-74px desktop, line-height 0.98 */}
              <h1 className="text-[clamp(2.25rem,4.3vw,4.125rem)] font-semibold text-[#111317] tracking-[-0.03em] leading-[0.98] sm:leading-[1.0] mb-5">
                {titleLines.map((line, idx) => (
                  <span key={idx} className="block">
                    {line}
                  </span>
                ))}
              </h1>

              {/* Supporting Copy: 16-17px, max-w 480px, comfortable leading */}
              <p className="text-[16px] sm:text-[17px] text-[#4E5661] max-w-[480px] leading-[1.55] mb-8 font-normal">
                {supporting}
              </p>

              {/* CTAs: 8px rectangular buttons, no pills, no glow */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Link href={primaryCta.href}>
                  <button
                    className="h-[46px] px-6 rounded-[8px] text-[14px] font-medium bg-[#111317] text-white hover:bg-[#1C1F26] transition-colors duration-150 inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    {primaryCta.text}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>

                {secondaryCta && (
                  <Link href={secondaryCta.href}>
                    <button
                      className="h-[46px] px-6 rounded-[8px] text-[14px] font-medium bg-white/90 backdrop-blur-sm border border-[rgba(17,19,23,0.14)] text-[#111317] hover:bg-white transition-colors duration-150 inline-flex items-center cursor-pointer shadow-xs"
                    >
                      {secondaryCta.text}
                    </button>
                  </Link>
                )}
              </div>

              {/* Trust Strip: Quiet editorial row with thin vertical separators */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-[#5A626E]">
                <span>01 Clear scope</span>
                <span className="w-px h-3 bg-[rgba(17,19,23,0.20)]" aria-hidden="true" />
                <span>02 Real progress</span>
                <span className="w-px h-3 bg-[rgba(17,19,23,0.20)]" aria-hidden="true" />
                <span>03 Private staging</span>
                <span className="w-px h-3 bg-[rgba(17,19,23,0.20)]" aria-hidden="true" />
                <span>04 Direct communication</span>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
}
