"use client";

import React, { useState, useEffect } from "react";
import {
  isAssetCached,
  markAssetCached,
  ROUTE_CRITICAL_HERO_MAP,
} from "@/lib/readiness/page-readiness";

interface PageReadinessGateProps {
  pagePath: string;
  criticalImageSrc?: string;
  dataPromise?: Promise<unknown>;
  children: React.ReactNode;
  fallbackSkeleton?: React.ReactNode;
}

/**
 * PageReadinessGate
 * 
 * Production Readiness Architecture (Requirements 09, 10, 11):
 * - NEVER unmounts or hides critical above-the-fold HTML / typography / hero elements.
 * - Allows Next.js SSR and the browser preload scanner to immediately discover LCP candidates.
 * - Tracks readiness in background without artificial timers or blocking delays.
 * - Displays a sleek top-edge indicator only if background network/data work is pending.
 */
export function PageReadinessGate({
  pagePath,
  criticalImageSrc,
  dataPromise,
  children,
}: PageReadinessGateProps) {
  const effectiveHeroSrc =
    criticalImageSrc || ROUTE_CRITICAL_HERO_MAP[pagePath] || "";

  const [isPending, setIsPending] = useState(Boolean(dataPromise));

  useEffect(() => {
    if (effectiveHeroSrc) {
      markAssetCached(effectiveHeroSrc);
    }

    if (dataPromise) {
      dataPromise
        .catch(() => {})
        .finally(() => {
          setIsPending(false);
        });
    }
  }, [effectiveHeroSrc, dataPromise]);

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      {/* ── Screen Reader Announcement ── */}
      <div className="sr-only" aria-live="polite">
        {isPending ? "Preparing dynamic data..." : "Page ready."}
      </div>

      {/* ── Sleek Editorial Top Progress Indicator (Only when background data promise is active) ── */}
      {isPending && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] pointer-events-none"
          role="progressbar"
          aria-label="Loading page data"
        >
          <div className="w-full h-[2px] bg-[rgba(17,19,23,0.06)] overflow-hidden">
            <div className="h-full bg-[#111317] w-1/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* 
        CRITICAL PERFORMANCE FIX:
        The server-rendered HTML and LCP elements remain permanently in the DOM.
        Never hide or unmount children. 
      */}
      <div className="w-full flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
}
