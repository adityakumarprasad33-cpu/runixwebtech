"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { type Project } from "@/data/projects";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ShowcaseViewer = dynamic(() => import("@/components/showcase/ShowcaseViewer"), {
  ssr: false,
});

export default function WorkPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsub = onSnapshot(
      collection(db, "projects"),
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as Project));
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

  const uniqueCategories = Array.from(new Set(dbProjects.map((p) => p.category).filter(Boolean)));
  const categories = uniqueCategories.length > 0 ? ["All", ...uniqueCategories] : [];

  const filteredProjects = activeCategory === "All"
    ? dbProjects
    : dbProjects.filter((p) => p.category === activeCategory);

  return (
    <div className="flex flex-col w-full items-center relative bg-[#050505] overflow-hidden min-h-screen">
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-10" />

      {/* Hero Section */}
      <section className="relative w-full min-h-[50vh] flex flex-col items-center justify-center pt-32 md:pt-36 pb-16 px-4 z-10 border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto w-full text-center flex flex-col items-center"
        >
          <h1 className="font-jakarta text-6xl md:text-8xl lg:text-[9rem] text-white tracking-tighter mb-8 leading-[0.85] font-black uppercase text-glow">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-white">Archive</span>
          </h1>

          <p className="text-xl md:text-3xl text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight mb-12">
            A curated selection of our finest digital builds and interactive experiences.
          </p>

          {/* Category Filter Pills (Only if projects exist) */}
          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 bg-white/5 border border-white/10 p-2 sm:p-3 rounded-full backdrop-blur-md">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                    activeCategory === category
                      ? "text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {mounted && activeCategory === category && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-white rounded-full -z-10 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  <span className="relative z-10">{category}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* Project Grid */}
      <section className="py-24 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {loading ? (
          <div className="text-center py-24 text-xs text-zinc-500">
            Loading showcase projects...
          </div>
        ) : dbProjects.length === 0 ? (
          <div className="p-16 rounded-[2.5rem] bg-white/[0.02] border border-white/10 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 text-zinc-400 flex items-center justify-center mx-auto">
              <FolderKanban className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">No Showcase Projects Published Yet</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Showcase case studies and portfolio builds published by administrators in the CMS will appear here live.
            </p>
            <div className="pt-2">
              <Button variant="accent" size="sm" asChild className="rounded-xl">
                <Link href="/pricing" className="flex items-center gap-1.5 font-bold">
                  Explore Services & Pricing <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-32 text-zinc-500 font-medium text-xl tracking-tight">
            No projects found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.slug || `proj-${i}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: (i % 2) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col ${i % 2 !== 0 ? "md:mt-32" : ""}`}
              >
                <div
                  className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden cursor-pointer group relative bg-zinc-900 border border-white/5 mb-8"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-black/20 z-10 opacity-60 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />

                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm tracking-widest uppercase scale-0 group-hover:scale-100 transition-transform duration-500 ease-out shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                      Full View
                    </div>
                  </div>

                  {project.live_url ? (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none transition-transform duration-1000 group-hover:scale-110">
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
                  ) : project.thumbnail ? (
                    <div
                      className="w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                      style={{ backgroundImage: `url(${project.thumbnail})` }}
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 transition-transform duration-1000 group-hover:scale-110" />
                  )}
                </div>

                <div className="px-2">
                  <div className="flex gap-3 mb-4">
                    {project.category && (
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {project.category}
                      </span>
                    )}
                    {project.year && (
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {project.year}
                      </span>
                    )}
                  </div>
                  <h3 className="text-4xl font-black font-jakarta text-white mb-4 tracking-tight">{project.title}</h3>
                  <p className="text-lg text-zinc-400 leading-relaxed">{project.summary}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Work CTA */}
      <section className="py-24 w-full max-w-7xl px-4 text-center relative z-10 mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-[3rem] p-16 md:p-24 relative overflow-hidden bg-zinc-900/50 border border-white/5 backdrop-blur-3xl"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

          <h2 className="font-jakarta text-5xl md:text-7xl font-black text-white mb-6 relative z-10 tracking-tighter uppercase">
            Need Something Built?
          </h2>
          <p className="text-xl text-zinc-400 mb-10 relative z-10 max-w-2xl mx-auto leading-relaxed font-medium">
            We build high-converting landing pages, multi-page business websites, and full-stack SaaS web applications.
          </p>
          <Link href="/pricing" className="relative z-10">
            <Button size="lg" variant="default" className="rounded-full h-16 px-12 text-lg hover:scale-105">
              Explore Milestone Pricing <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <ShowcaseViewer project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
