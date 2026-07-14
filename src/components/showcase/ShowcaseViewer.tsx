"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Maximize2, Monitor } from "lucide-react";
import type { Project } from "@/data/projects";

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

  return (
    <AnimatePresence>
      {project && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm"
          />

          {/* Modal Window */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-6xl h-full max-h-[90vh] bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
          >
            {/* Browser-style Top Bar */}
            <div className="h-12 bg-brand-card border-b border-brand-border flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              
              <div className="flex-1 flex justify-center">
                <div className="bg-brand-bg px-4 py-1.5 rounded-md text-xs font-medium text-brand-muted flex items-center gap-2 border border-brand-border/50 max-w-md w-full justify-center">
                  <Monitor className="w-3 h-3" />
                  {project.title}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-brand-muted hover:text-brand-text hover:bg-brand-bg rounded-md transition-colors"
                    title="Open live site"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-brand-muted hover:text-brand-text hover:bg-brand-bg rounded-md transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-brand-bg relative overflow-hidden">
              {project.live_url ? (
                <>
                  {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-brand-bg">
                      <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
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
                  <div className="w-24 h-24 mb-6 bg-brand-surface rounded-full flex items-center justify-center border border-brand-border">
                    <Maximize2 className="w-10 h-10 text-brand-muted" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-text mb-4">Live Preview Not Available</h3>
                  <p className="text-brand-muted max-w-md mb-8">
                    This project is currently a concept or the live link is not publicly available for embedding.
                  </p>
                  <div className="flex gap-4">
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-card transition-colors">
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
