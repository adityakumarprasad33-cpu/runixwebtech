"use client";

import React from "react";
import { RunixSkeleton } from "./RunixSkeleton";

/**
 * CaseStudySkeleton — Matches the large visual case study layout
 */
export function CaseStudySkeleton() {
  return (
    <div className="bg-white border border-[rgba(17,19,23,0.08)] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(17,19,23,0.03)] grid grid-cols-1 lg:grid-cols-12">
      {/* Browser Window Window Skeleton (7 cols) */}
      <div className="lg:col-span-7 bg-[#E8EAED] border-b lg:border-b-0 lg:border-r border-[rgba(17,19,23,0.08)] relative aspect-[16/10] flex flex-col">
        {/* Browser Chrome Header */}
        <div className="h-9 px-4 bg-[#F1F2F4] border-b border-[rgba(17,19,23,0.06)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(17,19,23,0.18)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(17,19,23,0.18)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(17,19,23,0.18)]" />
          </div>
          <RunixSkeleton className="w-32 h-4 rounded" />
          <div className="w-6" />
        </div>
        {/* Mockup Surface */}
        <div className="flex-1 p-6 flex items-center justify-center bg-[#F8F9FA]">
          <RunixSkeleton className="w-full h-full rounded shadow-xs" />
        </div>
      </div>

      {/* Editorial Details Skeleton (5 cols) */}
      <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between bg-white space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <RunixSkeleton className="w-24 h-4 rounded" />
            <RunixSkeleton className="w-12 h-4 rounded" />
          </div>
          <RunixSkeleton className="h-7 w-3/4 rounded mb-3" />
          <div className="space-y-2 mb-6">
            <RunixSkeleton className="h-4 w-full rounded" />
            <RunixSkeleton className="h-4 w-5/6 rounded" />
          </div>
          <RunixSkeleton className="h-16 w-full rounded-[8px]" />
        </div>

        <div className="pt-4 border-t border-[rgba(17,19,23,0.06)] flex items-center justify-between">
          <div className="flex gap-2">
            <RunixSkeleton className="w-16 h-5 rounded" />
            <RunixSkeleton className="w-16 h-5 rounded" />
          </div>
          <RunixSkeleton className="w-24 h-4 rounded" />
        </div>
      </div>
    </div>
  );
}
