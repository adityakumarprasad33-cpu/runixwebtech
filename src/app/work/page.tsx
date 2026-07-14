"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ShowcaseViewer from "@/components/showcase/ShowcaseViewer";
import { Button } from "@/components/ui/Button";
import { type Project } from "@/data/projects";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function WorkPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const snap = await getDocs(collection(db, "projects"));
        const data = snap.docs.map(doc => doc.data() as Project);
        setDbProjects(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const categories = ["All", ...Array.from(new Set(dbProjects.map(p => p.category)))];

  const filteredProjects = activeCategory === "All" 
    ? dbProjects 
    : dbProjects.filter(p => p.category === activeCategory);

  return (
    <div className="flex flex-col w-full items-center relative bg-[#050505] overflow-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-10" />

      {/* Hero Section */}
      <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-center pt-32 pb-16 px-4 z-10 border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto w-full text-center flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em]">Portfolio</span>
          </div>
          
          <h1 className="font-jakarta text-6xl md:text-8xl lg:text-[9rem] text-white tracking-tighter mb-8 leading-[0.85] font-black uppercase text-glow">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-white">Archive</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight mb-16">
            A curated selection of our finest digital builds and interactive experiences.
          </p>

          {/* Glowing Pill Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 bg-white/5 border border-white/10 p-3 rounded-full backdrop-blur-md">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeCategory === category 
                    ? "text-black" 
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {activeCategory === category && (
                  <motion.div 
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-white rounded-full -z-10 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                {category}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Project Grid */}
      <section className="py-32 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
          {filteredProjects.map((project, i) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: (i % 2) * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col ${i % 2 !== 0 ? 'md:mt-32' : ''}`}
            >
              <div 
                className="w-full aspect-[4/5] rounded-[2rem] overflow-hidden cursor-pointer group relative bg-zinc-900 border border-white/5 mb-8"
                onClick={() => setSelectedProject(project)}
              >
                {/* Subtle noise/gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-black/20 z-10 opacity-60 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
                
                {/* Hover reveal text */}
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm tracking-widest uppercase scale-0 group-hover:scale-100 transition-transform duration-500 ease-out shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                    Full View
                  </div>
                </div>
                
                {/* Project Image or Iframe */}
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
                ) : (
                  <div className="w-full h-full bg-zinc-800 transition-transform duration-1000 group-hover:scale-110" />
                )}
              </div>
              
              <div className="px-2">
                <div className="flex gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    {project.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    {project.year}
                  </span>
                </div>
                <h3 className="text-4xl font-black font-jakarta text-white mb-4 tracking-tight">{project.title}</h3>
                <p className="text-lg text-zinc-400 leading-relaxed">{project.summary}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-32 text-zinc-500 font-medium text-2xl tracking-tight">
            No projects found in this category.
          </div>
        )}
      </section>

      {/* Work CTA */}
      <section className="py-32 w-full max-w-7xl px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-[3rem] p-16 md:p-24 relative overflow-hidden bg-zinc-900/50 border border-white/5 backdrop-blur-3xl"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <h2 className="font-jakarta text-5xl md:text-7xl font-black text-white mb-6 relative z-10 tracking-tighter uppercase">
            Need Something Similar?
          </h2>
          <p className="text-xl text-zinc-400 mb-10 relative z-10 max-w-2xl mx-auto leading-relaxed font-medium">
            If you’ve seen a project direction you like, we can build a tailored, high-performance version for your own business or platform.
          </p>
          <Link href="/contact" className="relative z-10">
            <Button size="lg" variant="default" className="rounded-full h-16 px-12 text-lg shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105">
              Discuss Your Project
            </Button>
          </Link>
        </motion.div>
      </section>

      <ShowcaseViewer project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
