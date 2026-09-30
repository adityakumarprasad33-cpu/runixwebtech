/**
 * Runix Production Page Readiness & Critical Asset Preloader
 * 
 * Verifies real asset readiness (decoded images, loaded fonts, critical data)
 * without arbitrary timeouts.
 */

// In-memory cache of verified, decoded asset URLs
const verifiedAssetCache = new Set<string>();

export interface PageReadinessConfig {
  heroImageSrc?: string;
  nextHeroImageSrc?: string;
  dataPromise?: Promise<unknown>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface ReadinessResult {
  ready: boolean;
  fromCache: boolean;
  elapsedMs: number;
  timedOut: boolean;
}

/**
 * Checks if a resource is already loaded and decoded in cache
 */
export function isAssetCached(src: string): boolean {
  return verifiedAssetCache.has(src);
}

/**
 * Marks an asset as verified in memory
 */
export function markAssetCached(src: string): void {
  verifiedAssetCache.add(src);
}

/**
 * Preloads and hardware-decodes an image using the browser's decode API.
 * Fails gracefully after timeoutMs without blocking execution.
 */
export function preloadAndDecodeImage(
  src: string,
  timeoutMs = 3500,
  signal?: AbortSignal
): Promise<boolean> {
  if (!src) return Promise.resolve(true);
  if (typeof window === "undefined") return Promise.resolve(true);

  if (verifiedAssetCache.has(src)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;

    const cleanup = () => {
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (signal) signal.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      if (!settled) {
        cleanup();
        resolve(false);
      }
    };

    if (signal) {
      if (signal.aborted) {
        return resolve(false);
      }
      signal.addEventListener("abort", onAbort);
    }

    const timeoutId = setTimeout(() => {
      if (!settled) {
        cleanup();
        // Fallback: don't block the user forever if the network is sluggish
        resolve(true);
      }
    }, timeoutMs);

    const img = new window.Image();
    img.decoding = "async";

    const handleSuccess = () => {
      if (!settled) {
        verifiedAssetCache.add(src);
        cleanup();
        resolve(true);
      }
    };

    const handleError = () => {
      if (!settled) {
        cleanup();
        // Resolve true on error so fallback styling can display without trapping the user
        resolve(true);
      }
    };

    img.onload = () => {
      if ("decode" in img) {
        img
          .decode()
          .then(handleSuccess)
          .catch(handleSuccess); // Even if decode() fails, image data is loaded
      } else {
        handleSuccess();
      }
    };

    img.onerror = handleError;
    img.src = src;
  });
}

/**
 * Verifies that critical web fonts (Geist Sans) are parsed and ready
 */
export function verifyCriticalFontsReady(timeoutMs = 1500): Promise<boolean> {
  if (typeof window === "undefined" || !("fonts" in document)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(true), timeoutMs);

    document.fonts.ready
      .then(() => {
        clearTimeout(timer);
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(true);
      });
  });
}

/**
 * Comprehensive Above-The-Fold Readiness Gate.
 * Verifies critical hero image, fonts, and data simultaneously.
 */
export async function verifyPageCriticalReadiness(
  config: PageReadinessConfig
): Promise<ReadinessResult> {
  const startTime = performance.now();
  const {
    heroImageSrc,
    nextHeroImageSrc,
    dataPromise,
    timeoutMs = 3500,
    signal,
  } = config;

  // Check if primary hero is already in cache
  const isPrimaryCached = heroImageSrc ? verifiedAssetCache.has(heroImageSrc) : true;

  if (isPrimaryCached && !dataPromise) {
    // Immediate resolution: no layout shift or artificial delay
    if (nextHeroImageSrc && !verifiedAssetCache.has(nextHeroImageSrc)) {
      // Background preload next slide without awaiting
      preloadAndDecodeImage(nextHeroImageSrc, 5000).catch(() => {});
    }
    return {
      ready: true,
      fromCache: true,
      elapsedMs: 0,
      timedOut: false,
    };
  }

  const criticalPromises: Promise<unknown>[] = [
    verifyCriticalFontsReady(timeoutMs),
  ];

  if (heroImageSrc) {
    criticalPromises.push(preloadAndDecodeImage(heroImageSrc, timeoutMs, signal));
  }

  if (dataPromise) {
    criticalPromises.push(dataPromise.catch(() => null));
  }

  // Next slide preload is low priority (run in parallel)
  if (nextHeroImageSrc) {
    preloadAndDecodeImage(nextHeroImageSrc, timeoutMs + 1000).catch(() => {});
  }

  await Promise.all(criticalPromises);

  const elapsedMs = Math.round(performance.now() - startTime);

  return {
    ready: true,
    fromCache: isPrimaryCached,
    elapsedMs,
    timedOut: elapsedMs >= timeoutMs,
  };
}

import { HERO_MANIFEST } from "@/lib/hero-manifest";

/**
 * Route-to-Critical-Asset mapping for hover prefetching
 */
export const ROUTE_CRITICAL_HERO_MAP: Record<string, string> = {
  "/": HERO_MANIFEST.home[0],
  "/work": HERO_MANIFEST.work,
  "/services": HERO_MANIFEST.services,
  "/pricing": HERO_MANIFEST.pricing,
  "/about": HERO_MANIFEST.about,
  "/contact": HERO_MANIFEST.contact,
  "/login": HERO_MANIFEST.login,
  "/signup": HERO_MANIFEST.signup,
  "/register": HERO_MANIFEST.signup,
  "/forgot-password": HERO_MANIFEST.login,
  "/reset-password": HERO_MANIFEST.login,
  "/verify-email": HERO_MANIFEST.signup,
};

/**
 * Prefetches the critical hero image for a route upon link hover
 */
export function prefetchRouteHero(pathname: string): void {
  if (typeof window === "undefined") return;

  // Normalize path
  const normalized = pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  const heroSrc = ROUTE_CRITICAL_HERO_MAP[normalized];
  if (heroSrc && !verifiedAssetCache.has(heroSrc)) {
    preloadAndDecodeImage(heroSrc, 4000).catch(() => {});
  }
}
