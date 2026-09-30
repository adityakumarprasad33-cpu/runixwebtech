"use client";

import React from "react";

export interface RunixSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base Runix Skeleton Primitive
 * Uses calibrated #E5E7EB base with #F3F4F6 shimmer highlight.
 */
export function RunixSkeleton({ className = "", ...props }: RunixSkeletonProps) {
  return (
    <div
      className={`runix-skeleton-shimmer rounded-[6px] ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function TextSkeleton({
  lines = 2,
  className = "",
  size = "base",
}: {
  lines?: number;
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "headline";
}) {
  const heightClass = {
    xs: "h-3 my-1",
    sm: "h-3.5 my-1.5",
    base: "h-4 my-2",
    lg: "h-6 my-2.5",
    headline: "h-12 sm:h-16 my-3",
  }[size];

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <RunixSkeleton
          key={i}
          className={`${heightClass} ${
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

export function ButtonSkeleton({
  className = "",
  variant = "primary",
}: {
  className?: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <RunixSkeleton
      className={`h-[46px] rounded-[8px] ${
        variant === "primary" ? "w-36 bg-[#D1D5DB]" : "w-32 bg-[#E5E7EB]"
      } ${className}`}
    />
  );
}
