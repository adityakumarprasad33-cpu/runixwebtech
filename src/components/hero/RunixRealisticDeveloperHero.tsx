"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  HERO_SLIDES,
  DEDICATED_HEROES,
  type RunixHeroPage,
} from "@/lib/hero-scenes";
import { ResponsiveHeroPicture } from "./ResponsiveHeroPicture";

interface RunixRealisticDeveloperHeroProps {
  page?: RunixHeroPage;
}

export default function RunixRealisticDeveloperHero({
  page = "home",
}: RunixRealisticDeveloperHeroProps) {
  const isHome = page === "home";

  // Active slide state
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [prevSlideIdx, setPrevSlideIdx] = useState<number | null>(null);
  const [slide1Loaded, setSlide1Loaded] = useState(false);

  // Dedicated config for internal pages
  const dedicatedConfig = !isHome
    ? DEDICATED_HEROES[page as Exclude<RunixHeroPage, "home">]
    : null;

  // Active slide content
  const activeSlide = isHome ? HERO_SLIDES[currentSlideIdx] : null;
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

  // Requirement 03 & 07: Prepare next slide ONLY after current slide is ready
  useEffect(() => {
    if (!isHome || typeof window === "undefined") return;

    // Only prepare next slide once initial critical slide is active
    const nextIdx = (currentSlideIdx + 1) % HERO_SLIDES.length;
    const nextSlide = HERO_SLIDES[nextIdx];
    
    // Choose format based on screen width
    const isMobile = window.innerWidth < 768;
    const basePath = nextSlide.imageSrc.replace(/\.(jpe?g|png)$/i, "");
    const preloadTarget = isMobile ? `${basePath}-mobile.avif` : `${basePath}.avif`;

    const img = new Image();
    img.src = preloadTarget;
  }, [isHome, currentSlideIdx]);

  // 3-second automatic continuous slideshow loop for Homepage (Requirement 03 & 07)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isHome) return;

    timerRef.current = setTimeout(() => {
      setPrevSlideIdx(currentSlideIdx);
      setCurrentSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isHome, currentSlideIdx]);

  // Clean up previous slide from memory 850ms after transition completes
  useEffect(() => {
    if (prevSlideIdx === null) return;
    const cleanup = setTimeout(() => {
      setPrevSlideIdx(null);
    }, 850);
    return () => clearTimeout(cleanup);
  }, [prevSlideIdx]);

  return (
    <section
      className="relative w-full min-h-[82vh] lg:min-h-[86vh] flex items-center overflow-hidden z-10 bg-[#E8EAED]"
      aria-label={titleLines.join(" ")}
    >
      {/* ── FULL-BLEED REALISTIC HERO ASSETS (PURE CSS TRANSITIONS, ZERO FRAMER-MOTION OVERHEAD) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {isHome ? (
          <>
            {/* 
              PERMANENT BASE SLIDE 1:
              Slide 1 is rendered once and never unmounted. It is the sole LCP candidate,
              loaded with high priority, discovering immediate responsive AVIF.
            */}
            <div className="absolute inset-0 w-full h-full z-0">
              <ResponsiveHeroPicture
                baseSrc={HERO_SLIDES[0].imageSrc}
                alt={HERO_SLIDES[0].alt}
                priority={true}
                isLcpCandidate={true}
                onLoad={() => setSlide1Loaded(true)}
                className="w-full h-full object-cover object-[72%_center] sm:object-[70%_center] lg:object-[68%_center]"
              />
            </div>

            {/* Exiting non-base slide (Slide 2-5 crossfade out) */}
            {prevSlideIdx !== null && prevSlideIdx > 0 && (
              <div
                key={`slide-prev-${HERO_SLIDES[prevSlideIdx].id}`}
                className="absolute inset-0 w-full h-full z-10 opacity-0 transition-opacity duration-[750ms] ease-in-out pointer-events-none"
              >
                <ResponsiveHeroPicture
                  baseSrc={HERO_SLIDES[prevSlideIdx].imageSrc}
                  alt={HERO_SLIDES[prevSlideIdx].alt}
                  priority={false}
                  isLcpCandidate={false}
                  className="w-full h-full object-cover object-[72%_center] sm:object-[70%_center] lg:object-[68%_center]"
                />
              </div>
            )}

            {/* Current active non-base slide (Slide 2-5 crossfade in on top of base) */}
            {currentSlideIdx > 0 && (
              <div
                key={`slide-curr-${activeSlide!.id}`}
                className="absolute inset-0 w-full h-full z-10 opacity-100 transition-opacity duration-[750ms] ease-in-out"
              >
                <ResponsiveHeroPicture
                  baseSrc={activeSlide!.imageSrc}
                  alt={activeSlide!.alt}
                  priority={false}
                  isLcpCandidate={false}
                  className="w-full h-full object-cover object-[72%_center] sm:object-[70%_center] lg:object-[68%_center]"
                />
              </div>
            )}
          </>
        ) : (
          /* Dedicated Route Hero (Direct rendering, no slideshow logic) */
          <div className="absolute inset-0 w-full h-full">
            <ResponsiveHeroPicture
              baseSrc={dedicatedConfig!.imageSrc}
              alt={dedicatedConfig!.alt}
              priority={true}
              isLcpCandidate={true}
              className="w-full h-full object-cover object-[72%_center] sm:object-[70%_center] lg:object-[68%_center]"
            />
          </div>
        )}

        {/* 
          CRITICAL VISUAL COMPOSITION: 
          No full-hero white wash overlay. Photographic richness preserved.
          Only a subtle mobile-only gradient behind text on narrow viewports.
        */}
        <div className="md:hidden absolute inset-0 z-[12] pointer-events-none bg-gradient-to-b from-white/70 via-white/20 to-transparent" />
      </div>

      {/* ── HERO CONTENT OVERLAY (Composed Left 45% Zone) ── */}
      <div className="relative z-20 w-full max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-32 sm:pt-36 pb-16 lg:pb-20">
        <div className="max-w-xl lg:max-w-[490px] min-h-[390px] sm:min-h-[410px] lg:min-h-[430px] flex flex-col justify-start">
          
          <div className="transition-opacity duration-300 ease-out">
            {/* Category Tag */}
            <div className="mb-4 min-h-[1.5rem]">
              <span className="section-label">
                {tag}
              </span>
            </div>

            {/* Master Headline: Geist Sans, weight 600, line-height 0.98 */}
            <h1 className="text-[clamp(2.25rem,4.3vw,4.125rem)] font-semibold text-[#111317] tracking-[-0.03em] leading-[0.98] sm:leading-[1.0] mb-5 min-h-[4.5rem] sm:min-h-[5rem] lg:min-h-[8.5rem]">
              {titleLines.map((line, idx) => (
                <span key={idx} className="block">
                  {line}
                </span>
              ))}
            </h1>

            {/* Supporting Copy */}
            <p className="text-[16px] sm:text-[17px] text-[#4E5661] max-w-[480px] leading-[1.55] mb-8 font-normal min-h-[3.75rem] sm:min-h-[4.25rem]">
              {supporting}
            </p>

            {/* CTAs: 8px rectangular buttons, crisp and solid */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Link
                href={primaryCta.href}
                className="h-[46px] px-6 rounded-[8px] text-[14px] font-medium bg-[#111317] text-white hover:bg-[#1C1F26] transition-colors duration-150 inline-flex items-center gap-2 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#315EF7]"
              >
                {primaryCta.text}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>

              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="h-[46px] px-6 rounded-[8px] text-[14px] font-medium bg-white/90 backdrop-blur-sm border border-[rgba(17,19,23,0.14)] text-[#111317] hover:bg-white transition-colors duration-150 inline-flex items-center cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#315EF7]"
                >
                  {secondaryCta.text}
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
          </div>

        </div>
      </div>
    </section>
  );
}
