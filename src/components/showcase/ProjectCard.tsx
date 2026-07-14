"use client";

import { motion } from "framer-motion";
import { ExternalLink, Eye } from "lucide-react";
import type { Project } from "@/data/projects";
import { Button } from "@/components/ui/Button";

interface ProjectCardProps {
  project: Project;
  onOpenViewer: (project: Project) => void;
}

export default function ProjectCard({ project, onOpenViewer }: ProjectCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative flex flex-col bg-brand-card rounded-xl border border-brand-border overflow-hidden shadow-lg transition-all"
    >
      {/* Thumbnail area */}
      <div className="relative aspect-[16/10] bg-brand-surface overflow-hidden">
        {project.live_url ? (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left scale-[0.25]">
              <iframe
                src={project.live_url}
                className="w-full h-full border-0 pointer-events-none"
                tabIndex={-1}
                scrolling="no"
                aria-hidden="true"
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-surface text-brand-muted/20 text-4xl font-bold">
            {project.title.substring(0, 2).toUpperCase()}
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-brand-bg/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenViewer(project)}
            className="flex items-center gap-2 font-bold px-6 py-2 shadow-xl"
          >
            <Eye className="w-4 h-4" />
            Full View
          </Button>
          {project.live_url && (
            <Button asChild variant="secondary" size="sm">
              <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Live
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-brand-accent uppercase tracking-wider">
            {project.category}
          </span>
          {project.featured && (
            <span className="text-xs font-medium text-brand-text bg-brand-surface px-2 py-1 rounded-full border border-brand-border">
              Featured
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-brand-text mb-2">
          {project.title}
        </h3>
        
        <p className="text-sm text-brand-muted mb-6 flex-grow">
          {project.summary}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-brand-muted bg-brand-surface px-2 py-1 rounded-md border border-brand-border">
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="text-xs text-brand-muted bg-brand-surface px-2 py-1 rounded-md border border-brand-border">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
