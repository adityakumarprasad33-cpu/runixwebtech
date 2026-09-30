"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  verifyPageCriticalReadiness,
  isAssetCached,
  ROUTE_CRITICAL_HERO_MAP,
} from "@/lib/readiness/page-readiness";
import { HeroSkeleton } from "@/components/ui/skeleton/HeroSkeleton";

interface PageReadinessGateProps {
  pagePath: string;
  criticalImageSrc?: string;
  dataPromise?: Promise<unknown>;
  children: React.ReactNode;
  fallbackSkeleton?: React.ReactNode;
}

export function PageReadinessGate({
  pagePath,
  criticalImageSrc,
  dataPromise,
  children,
  fallbackSkeleton,
}: PageReadinessGateProps) {
  // Determine effective critical hero image for this route
  const effectiveHeroSrc =
    criticalImageSrc || ROUTE_CRITICAL_HERO_MAP[pagePath] || "";

  // If critical image is ALREADY cached in memory, start ready immediately! (Zero delay)
  const isImmediatelyReady = effectiveHeroSrc
    ? isAssetCached(effectiveHeroSrc)
    : true;

  const [isReady, setIsReady] = useState(isImmediatelyReady);
  const [isRevealed, setIsRevealed] = useState(isImmediatelyReady);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // If already verified/cached, skip loading gate completely
    if (effectiveHeroSrc && isAssetCached(effectiveHeroSrc) && !dataPromise) {
      setIsReady(true);
      setIsRevealed(true);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let mounted = true;

    // Verify real readiness
    verifyPageCriticalReadiness({
      heroImageSrc: effectiveHeroSrc,
      dataPromise,
      timeoutMs: 3500,
      signal: controller.signal,
    }).then((result) => {
      if (!mounted) return;

      setIsReady(true);

      // Smooth reveal sequence (300ms)
      const revealTimer = setTimeout(() => {
        if (mounted) {
          setIsRevealed(true);
        }
      }, 50);

      return () => clearTimeout(revealTimer);
    });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [pagePath, effectiveHeroSrc, dataPromise]);

  // When already ready and revealed, render page directly without wrapper overhead
  if (isReady && isRevealed) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative w-full min-h-screen flex flex-col"
      aria-busy={!isReady}
    >
      {/* ── Screen Reader Announcement ── */}
      <div className="sr-only" aria-live="polite">
        {isReady ? "Page ready." : "Preparing page experience..."}
      </div>

      {/* ── Polished Editorial Runix Readiness Bar ── */}
      {!isReady && (
        <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
          {/* Subtle thin progress track */}
          <div className="w-full h-[2px] bg-[rgba(17,19,23,0.06)] overflow-hidden">
            <motion.div
              className="h-full bg-[#111317]"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </div>
        </div>
      )}

      {/* ── Skeleton / Real Page Cross-Transition ── */}
      <AnimatePresence mode="wait">
        {!isReady ? (
          <motion.div
            key="page-skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex-grow flex flex-col"
          >
            {/* Runix Editorial Status Header */}
            <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-28 pb-4 flex items-center justify-between text-[12px] font-mono text-[#7B838E]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 relative">
                  <Image
                    src="/logo-v2.png"
                    alt="Runix"
                    fill
                    sizes="16px"
                    className="object-contain"
                  />
                </div>
                <span className="font-semibold tracking-tight text-[#111317]">
                  Runix
                </span>
                <span className="text-[rgba(17,19,23,0.2)]">/</span>
                <span>Preparing view</span>
              </div>
            </div>

            {/* Geometry-matched skeleton */}
            {fallbackSkeleton || <HeroSkeleton />}
          </motion.div>
        ) : (
          <motion.div
            key="page-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex-grow flex flex-col"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
