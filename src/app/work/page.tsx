"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FolderKanban, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { type Project, projects as defaultProjects } from "@/data/projects";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RunixRealisticDeveloperHero from "@/components/hero/RunixRealisticDeveloperHero";
import ShowcaseViewer from "@/components/showcase/ShowcaseViewer";
import { PageReadinessGate } from "@/components/readiness/PageReadinessGate";

export default function WorkPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "projects"),
      (snap) => {
        const data = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as unknown as Project)
        );
        setDbProjects(data);
        setLoading(false);
      },
      (err) => {
        console.error("Realtime work projects error:", err);
        setDbProjects([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const allProjects = dbProjects.length > 0 ? dbProjects : defaultProjects;
  const uniqueCategories = Array.from(
    new Set(allProjects.map((p) => p.category).filter(Boolean))
  );
  const categories = uniqueCategories.length > 0 ? ["All", ...uniqueCategories] : [];

  const filteredProjects =
    activeCategory === "All"
      ? allProjects
      : allProjects.filter((p) => p.category === activeCategory);

  return (
    <PageReadinessGate pagePath="/work">
      <div className="flex flex-col w-full items-center relative bg-[#F1F2F4] text-[#111317] overflow-x-clip min-h-screen">
        {/* Subtle dot grid */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-20" />

        {/* ── Hero ── */}
        <RunixRealisticDeveloperHero page="work" />

      {/* Filter and Archive Header */}
      <section className="w-full max-w-[1200px] px-6 sm:px-8 lg:px-16 pt-16 pb-8 z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <span className="section-label mb-3 block">Selected Portfolio</span>
            <h2 className="text-3xl md:text-[2.5rem] font-semibold text-[#111317] tracking-tight leading-[1.15]">
              Work that solved real problems.
            </h2>
            <p className="text-[#4E5661] text-[15px] mt-2 max-w-lg leading-relaxed">
              Explore recent client systems, production platforms, and web applications built by our studio.
            </p>
          </div>

          {/* Category Filter — Rectangular Buttons (8px radius) */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-1.5 bg-white border border-[rgba(17,19,23,0.08)] p-1 rounded-[8px]">
              {categories.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3.5 py-1.5 rounded-[6px] text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[#111317] text-white"
                        : "text-[#4E5661] hover:text-[#111317] hover:bg-[#F1F2F4]"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Editorial Case Studies Section */}
      <section className="py-6 pb-24 w-full max-w-[1200px] px-6 sm:px-8 lg:px-16 relative z-10">
        {loading && allProjects.length === 0 ? (
          <div className="text-center py-24 text-[13px] text-[#7B838E] font-mono">
            Loading projects...
          </div>
        ) : allProjects.length === 0 ? (
          <div className="p-12 rounded-xl bg-white border border-[rgba(17,19,23,0.08)] text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-lg bg-[#F1F2F4] text-[#4E5661] flex items-center justify-center mx-auto">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#111317]">No projects published yet</h3>
            <p className="text-[14px] text-[#4E5661] leading-relaxed">
              New client case studies and live builds will appear here.
            </p>
            <div className="pt-2">
              <Link href="/pricing">
                <Button size="sm" className="rounded-[8px] bg-[#111317] text-white hover:bg-[#1C1F26] text-[14px] font-medium">
                  View Pricing & Services <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-24 text-[#7B838E] text-[15px]">
            No projects found in this category.
          </div>
        ) : (
          <div className="flex flex-col gap-14 sm:gap-20">
            {filteredProjects.map((project, i) => (
              <motion.article
                key={project.slug || `proj-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4 }}
                className="bg-white border border-[rgba(17,19,23,0.08)] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(17,19,23,0.04)] grid grid-cols-1 lg:grid-cols-12"
              >
                {/* Visual Window (Left 7 Cols on desktop) */}
                <div
                  className="lg:col-span-7 bg-[#E8EAED] border-b lg:border-b-0 lg:border-r border-[rgba(17,19,23,0.08)] relative aspect-[16/10] overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedProject(project)}
                >
                  {project.live_url ? (
                    <div className="w-full h-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left scale-[0.25] pointer-events-none">
                        <iframe
                          src={project.live_url}
                          className="w-full h-full border-0 pointer-events-none"
                          tabIndex={-1}
                          scrolling="no"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  ) : project.thumbnail ? (
                    <div
                      className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
                      style={{ backgroundImage: `url(${project.thumbnail})` }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[13px] font-mono text-[#7B838E]">
                      Live Staging Environment
                    </div>
                  )}

                  {/* Hover Inspect Overlay */}
                  <div className="absolute inset-0 bg-[#111317]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-4 py-2 rounded-[8px] bg-[#111317] text-white text-[13px] font-medium shadow-md">
                      Inspect Project Details
                    </div>
                  </div>
                </div>

                {/* Editorial Content (Right 5 Cols on desktop) */}
                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-mono font-medium text-[#4E5661] bg-[#F1F2F4] border border-[rgba(17,19,23,0.06)]">
                        {project.category || "Web Application"}
                      </span>
                      {project.year && (
                        <span className="px-2 py-1 rounded-[6px] text-[11px] font-mono text-[#7B838E] bg-[#F1F2F4]">
                          {project.year}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-[#169B62] ml-auto font-medium">
                        {project.status || "Shipped"}
                      </span>
                    </div>

                    <h3 className="text-2xl font-semibold text-[#111317] tracking-tight">
                      {project.title}
                    </h3>

                    <div>
                      <h4 className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#7B838E] mb-1">
                        Overview
                      </h4>
                      <p className="text-[14px] text-[#4E5661] leading-relaxed">
                        {project.summary}
                      </p>
                    </div>

                    {project.problem_solved && (
                      <div>
                        <h4 className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#7B838E] mb-1">
                          Problem & Solution
                        </h4>
                        <p className="text-[13px] text-[#4E5661] leading-relaxed">
                          {project.problem_solved}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {project.stack?.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-[4px] bg-[#F8F9FA] border border-[rgba(17,19,23,0.06)] text-[11px] font-mono text-[#111317]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[rgba(17,19,23,0.06)] flex items-center justify-between">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="text-[14px] font-medium text-[#111317] hover:text-[#315EF7] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5 text-[#315EF7]" />
                    </button>
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-mono text-[#7B838E] hover:text-[#111317] transition-colors flex items-center gap-1"
                      >
                        Live Site <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="py-20 w-full px-6 sm:px-8 lg:px-16 relative z-10 bg-[#E8EAED] border-t border-[rgba(17,19,23,0.08)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-[1200px] mx-auto text-center"
        >
          <span className="section-label mb-3 block">
            Start a Project
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#111317] mb-4 tracking-tight">
            Have a project in mind?
          </h2>
          <p className="text-[15px] sm:text-base text-[#4E5661] mb-8 max-w-xl mx-auto leading-relaxed">
            Let&apos;s build something exceptional together. Transparent milestone pricing and direct technical collaboration.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/pricing">
              <Button
                size="lg"
                className="rounded-[8px] h-11 px-6 text-[14px] font-medium bg-[#111317] text-white hover:bg-[#1C1F26] flex items-center gap-2"
              >
                Configure & Price Project <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="rounded-[8px] h-11 px-6 text-[14px] font-medium"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <ShowcaseViewer project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
    </PageReadinessGate>
  );
}
