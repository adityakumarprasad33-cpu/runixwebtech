"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Maximize2, Monitor, Eye } from "lucide-react";
import type { Project } from "@/data/projects";
import { normalizeUrl } from "@/lib/safeFetch";

interface ShowcaseViewerProps {
  project: Project | null;
  onClose: () => void;
}

export default function ShowcaseViewer({ project, onClose }: ShowcaseViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset loaded state when project changes (handle via key or on open instead)
  useEffect(() => {
    // Moved the reset logic to the button click or useEffect dependency properly,
    // actually, doing it in an effect without setting state is better, or use a key on the image
  }, [project]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (project) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [project]);

  if (!project) return null;

  const validLiveUrl = project.live_url ? normalizeUrl(project.live_url) : null;

  return (
    <AnimatePresence>
      {project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#111317]/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
            className="relative w-full max-w-5xl h-[85vh] bg-[#FFFFFF] border border-[rgba(21,24,29,0.12)] rounded-2xl shadow-[0_24px_70px_rgba(21,24,29,0.18)] flex flex-col overflow-hidden z-10"
          >
            {/* Top Bar (Browser style) */}
            <div className="h-12 border-b border-[rgba(21,24,29,0.08)] bg-[#FAFAFA] px-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#D83A3A]/80" />
                <div className="w-3 h-3 rounded-full bg-[#B77900]/80" />
                <div className="w-3 h-3 rounded-full bg-[#169B62]/80" />
              </div>
              
              <div className="flex-1 flex justify-center">
                <div className="bg-[#FFFFFF] px-4 py-1 rounded-md text-xs font-mono font-medium text-[#4B5563] flex items-center gap-2 border border-[rgba(21,24,29,0.10)] max-w-md w-full justify-center shadow-xs">
                  <Monitor className="w-3 h-3 text-[#315EF7]" />
                  {project.title}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {validLiveUrl && (
                  <>
                    <a
                      href={`/preview?url=${encodeURIComponent(validLiveUrl)}&title=${encodeURIComponent(project.title)}&ref=/`}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#315EF7] bg-[#315EF7]/10 hover:bg-[#315EF7]/15 border border-[#315EF7]/20 rounded-md transition-colors"
                      title="Open in dedicated live viewer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Live Viewer</span>
                    </a>
                    <a
                      href={validLiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[#4B5563] hover:text-[#111317] hover:bg-[#F1F2F4] rounded-md transition-colors"
                      title="Open live site in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-[#4B5563] hover:text-[#111317] hover:bg-[#F1F2F4] rounded-md transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#F1F2F4] relative overflow-hidden">
              {project.live_url ? (
                <>
                  {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#F1F2F4]">
                      <div className="w-8 h-8 border-2 border-[#315EF7] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <iframe
                    src={project.live_url}
                    className="w-full h-full border-0"
                    onLoad={() => setIsLoaded(true)}
                    sandbox="allow-scripts allow-same-origin"
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 mb-6 bg-[#FFFFFF] rounded-2xl flex items-center justify-center border border-[rgba(21,24,29,0.10)] shadow-sm">
                    <Maximize2 className="w-8 h-8 text-[#4B5563]" />
                  </div>
                  <h3 className="text-xl font-bold  text-[#111317] mb-2">Live Preview Not Available</h3>
                  <p className="text-[#4B5563] text-sm max-w-md mb-6 leading-relaxed">
                    This project is currently in private staging or the live link is restricted to client environments.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={onClose}
                      className="px-6 py-2 rounded-xl bg-[#111317] text-white text-xs font-semibold hover:bg-[#000000] transition-colors cursor-pointer"
                    >
                      Close Viewer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
