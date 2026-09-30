/**
 * Central Runix Hero Asset Manifest
 * Single source of truth for all route-specific hero backgrounds.
 * 
 * STRICT RULE (Requirement 19 & 21):
 * Every internal page gets its OWN unique hero background.
 * No image asset may be reused across different routes.
 */

export interface HeroManifestType {
  home: readonly [string, string, string, string, string];
  work: string;
  services: string;
  pricing: string;
  about: string;
  contact: string;
  login: string;
  signup: string;
}

export const HERO_MANIFEST: HeroManifestType = {
  home: [
    "/images/heroes/home/home-01.jpg",
    "/images/heroes/home/home-02.jpg",
    "/images/heroes/home/home-03.jpg",
    "/images/heroes/home/home-04.jpg",
    "/images/heroes/home/home-05.jpg",
  ],
  work: "/images/heroes/work/work-hero.jpg",
  services: "/images/heroes/services/services-hero.jpg",
  pricing: "/images/heroes/pricing/pricing-hero.jpg",
  about: "/images/heroes/about/about-hero.jpg",
  contact: "/images/heroes/contact/contact-hero.jpg",
  login: "/images/heroes/login/login-hero.jpg",
  signup: "/images/heroes/signup/signup-hero.jpg",
} as const;

/**
 * Validation check that detects duplicate hero asset paths across routes.
 * Fails development validation if any asset is reused.
 */
export function validateHeroManifestUniqueness(): { valid: boolean; duplicates: string[] } {
  const assetToRouteMap = new Map<string, string>();
  const duplicateErrors: string[] = [];

  // 1. Check Homepage slides
  HERO_MANIFEST.home.forEach((slide, idx) => {
    const routeKey = `home[${idx + 1}]`;
    if (assetToRouteMap.has(slide)) {
      const existing = assetToRouteMap.get(slide)!;
      duplicateErrors.push(
        `Duplicate hero asset detected:\n${slide}\nassigned to:\n[${existing}]\n[${routeKey}]`
      );
    } else {
      assetToRouteMap.set(slide, routeKey);
    }
  });

  // 2. Check dedicated internal routes
  const internalRoutes: Array<keyof Omit<HeroManifestType, "home">> = [
    "work",
    "services",
    "pricing",
    "about",
    "contact",
    "login",
    "signup",
  ];

  for (const route of internalRoutes) {
    const asset = HERO_MANIFEST[route];
    if (assetToRouteMap.has(asset)) {
      const existing = assetToRouteMap.get(asset)!;
      const errorMsg = `Duplicate hero asset detected:\n${asset}\nassigned to:\n[${existing}]\n[${route}]`;
      duplicateErrors.push(errorMsg);
      console.error(errorMsg);
    } else {
      assetToRouteMap.set(asset, route);
    }
  }

  if (duplicateErrors.length > 0) {
    const combinedMessage = duplicateErrors.join("\n\n");
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`\n[HERO ASSET VALIDATION FAILED]\n${combinedMessage}\n`);
    }
    return { valid: false, duplicates: duplicateErrors };
  }

  return { valid: true, duplicates: [] };
}

// Authoritative development validation on module evaluation
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  validateHeroManifestUniqueness();
}

/**
 * Retrieves the unique hero asset assigned to a given pathname
 */
export function getHeroForPathname(pathname: string): string {
  const clean = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  switch (clean) {
    case "/work":
      return HERO_MANIFEST.work;
    case "/services":
      return HERO_MANIFEST.services;
    case "/pricing":
      return HERO_MANIFEST.pricing;
    case "/about":
      return HERO_MANIFEST.about;
    case "/contact":
      return HERO_MANIFEST.contact;
    case "/login":
    case "/forgot-password":
    case "/reset-password":
      return HERO_MANIFEST.login;
    case "/signup":
    case "/register":
    case "/verify-email":
      return HERO_MANIFEST.signup;
    case "":
    case "/":
    default:
      return HERO_MANIFEST.home[0];
  }
}
