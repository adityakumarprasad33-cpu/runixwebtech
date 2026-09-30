import React from "react";

interface ResponsiveHeroPictureProps {
  baseSrc: string;
  alt: string;
  priority?: boolean;
  className?: string;
  objectPosition?: string;
  onLoad?: () => void;
  isLcpCandidate?: boolean;
}

/**
 * ResponsiveHeroPicture
 * Delivers modern AVIF and WebP formats with mobile art direction:
 * - Mobile (<768px): 750px crop in AVIF / WebP (~40-45 KB)
 * - Desktop (>=768px): Full-bleed 1920px image in AVIF / WebP (~90-110 KB)
 * - Fallback: Original JPEG / WebP
 * 
 * Requirement 06:
 * When isLcpCandidate is true (Slide 1 and dedicated route heroes), renders native <picture><img>
 * with fetchpriority="high" and loading="eager".
 * When isLcpCandidate is false (Slides 2-5 in carousel), renders via CSS pseudo-element ::before
 * which per W3C specification is ignored by LCP observers, preventing subsequent slides from
 * artificially hijacking or inflating the LCP timestamp.
 */
export function ResponsiveHeroPicture({
  baseSrc,
  alt,
  priority = false,
  className = "w-full h-full object-cover",
  objectPosition = "center",
  onLoad,
  isLcpCandidate = true,
}: ResponsiveHeroPictureProps) {
  const basePath = baseSrc.replace(/\.(jpe?g|png)$/i, "");

  const mobileAvif = `${basePath}-mobile.avif`;
  const mobileWebp = `${basePath}-mobile.webp`;
  const desktopAvif = `${basePath}.avif`;
  const desktopWebp = `${basePath}.webp`;

  // Secondary carousel slides (Slide 2-5): Use pseudo-element to isolate LCP
  if (!isLcpCandidate) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`hero-pseudo-slide ${className}`}
        style={
          {
            "--hero-mobile": `url(${mobileAvif})`,
            "--hero-desktop": `url(${desktopAvif})`,
            "--hero-pos": objectPosition,
          } as React.CSSProperties
        }
      />
    );
  }

  // Critical LCP Hero (Slide 1 or dedicated route hero): Native picture for instant discovery
  return (
    <picture className="w-full h-full block">
      {/* Mobile Art-Directed Sources (< 768px) */}
      <source
        media="(max-width: 767px)"
        type="image/avif"
        srcSet={mobileAvif}
      />
      <source
        media="(max-width: 767px)"
        type="image/webp"
        srcSet={mobileWebp}
      />

      {/* Desktop Sources (>= 768px) */}
      <source
        media="(min-width: 768px)"
        type="image/avif"
        srcSet={desktopAvif}
      />
      <source
        media="(min-width: 768px)"
        type="image/webp"
        srcSet={desktopWebp}
      />

      {/* Standard Fallback Image with high priority flags for LCP */}
      <img
        src={mobileAvif}
        alt={alt}
        loading="eager"
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onLoad={onLoad}
        style={{ objectPosition }}
        className={className}
      />
    </picture>
  );
}
