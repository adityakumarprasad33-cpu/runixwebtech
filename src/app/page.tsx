"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Award,
  Layers,
  Layout,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Hero3DScroll from "@/components/hero/Hero3DScroll";
import { type Project } from "@/data/projects";

// Dynamically load modal viewer only when a user interacts
const ShowcaseViewer = dynamic(() => import("@/components/showcase/ShowcaseViewer"), {
  ssr: false,
});

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dbProjects, setDbProjects] = useState<Project[]>([]);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const subscribeProjects = async () => {
      try {
        const { collection, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        unsub = onSnapshot(
          collection(db, "projects"),
          (snap) => {
            const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as Project));
            setDbProjects(data);
          },
          (err) => {
            console.error("Realtime homepage projects error:", err);
          }
        );
      } catch (e) {
        // Fallback to static defaultProjects
      }
    };

    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        const handle = (window as any).requestIdleCallback(subscribeProjects, { timeout: 2000 });
        return () => {
          if ("cancelIdleCallback" in window) (window as any).cancelIdleCallback(handle);
          if (unsub) unsub();
        };
      } else {
        const timer = setTimeout(subscribeProjects, 500);
        return () => {
          clearTimeout(timer);
          if (unsub) unsub();
        };
      }
    }
  }, []);

  const displayProjects = dbProjects;

  return (
    <div className="flex flex-col w-full items-center bg-[#050505] overflow-x-clip">
      {/* Background Abstract Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-purple-600/10 blur-[120px] translate-x-1/4 -translate-y-1/4" />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-20" />

      {/* ── 3D Interactive Scroll Hero Section ── */}
      <Hero3DScroll />

      {/* ── What We Do / Services Highlights ── */}
      <section className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-28 relative z-10 border-t border-white/5 lazy-render">
        <div className="flex flex-col lg:flex-row gap-16 justify-between">
          <div className="lg:w-1/3">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-jakarta text-4xl md:text-6xl font-extrabold text-white tracking-tighter sticky top-32"
            >
              Core<br />Capabilities.
            </motion.h2>
          </div>

          <div className="lg:w-2/3 flex flex-col gap-10">
            {[
              {
                num: "01",
                title: "Bespoke Web Design",
                desc: "We build high-performance web applications, bespoke digital products, and complex user interfaces.",
              },
              {
                num: "02",
                title: "Full-Stack Web Applications",
                desc: "Scalable architectures, modern runtimes, and secure backend integrations.",
              },
              {
                num: "03",
                title: "Custom Dashboards & Panels",
                desc: "Data-driven administration panels and operational workflows.",
              },
            ].map((service, i) => (
              <motion.div
                key={service.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group border-b border-white/10 pb-10"
              >
                <div className="flex items-baseline gap-6 mb-4">
                  <span className="text-xl font-bold text-zinc-600 font-jakarta">
                    {service.num}
                  </span>
                  <h3 className="font-jakarta text-3xl md:text-4xl font-bold text-white group-hover:text-indigo-400 transition-colors duration-300 tracking-tight">
                    {service.title}
                  </h3>
                </div>
                <p className="text-lg text-zinc-400 ml-12 max-w-xl leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Selected Works (High Performance Visual Mockups) ── */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-28 relative z-10 bg-[#030303] lazy-render">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 flex flex-col md:flex-row items-end justify-between gap-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-jakarta text-4xl md:text-6xl font-extrabold text-white tracking-tighter"
            >
              Selected<br />Works
            </motion.h2>
            <Link href="/work">
              <Button
                variant="outline"
                className="rounded-full flex items-center gap-2 h-14 px-8 border-white/20 hover:border-white"
              >
                View All Projects
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {dbProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {dbProjects.slice(0, 4).map((project) => (
                <motion.div
                  key={project.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6 }}
                  className="group relative rounded-3xl bg-[#0c0c0c] border border-white/10 overflow-hidden hover:border-indigo-500/40 transition-all p-8 flex flex-col justify-between cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 uppercase tracking-widest">
                        {project.category || "Web App"}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        {project.status || "live"}
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold font-jakarta text-white mb-3 tracking-tight group-hover:text-indigo-300 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-3 mb-8 leading-relaxed">
                      {project.summary}
                    </p>
                  </div>

                  {/* Styled Visual UI Preview Card */}
                  <div className="w-full h-48 bg-zinc-900/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between group-hover:bg-zinc-800/80 transition-colors">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                      <span className="text-[10px] text-zinc-500 font-mono truncate">
                        {project.live_url || project.slug}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        Preview Case <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-indigo-500 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-[#0c0c0c] border border-white/5 text-center max-w-xl mx-auto space-y-4">
              <p className="text-sm text-zinc-400">
                New showcase builds and case studies published by administrators in the CMS will appear here live.
              </p>
              <Button variant="outline" size="sm" asChild className="rounded-full text-xs">
                <Link href="/pricing" className="flex items-center gap-1.5">
                  Explore Services & Pricing <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── 50/50 Milestone Pricing Teaser ── */}
      <section className="py-24 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-[3rem] p-10 md:p-16 bg-gradient-to-b from-indigo-950/40 via-zinc-900/60 to-black border border-white/10 backdrop-blur-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Zero-Risk Guarantee
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white font-jakarta tracking-tight">
              Pay 50% Advance. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                50% on Handover.
              </span>
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
              No upfront lock-in, no full advance risk. We build your sprint, stage a live demo preview for you to test, and you only settle the remaining 50% balance before source code handover.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-mono text-zinc-300">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Paytm PG / UPI</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-indigo-400" /> 48h–7d Sprints</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-purple-400" /> Live Staging Demo</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="accent"
                className="rounded-2xl h-14 px-8 text-sm font-bold w-full sm:w-auto flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
              >
                View Plans & Pricing <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final Call to Action ── */}
      <section className="w-full min-h-[60vh] flex items-center justify-center px-4 py-20 relative z-10 overflow-hidden lazy-render">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-7xl mx-auto rounded-[3rem] p-12 md:p-20 relative overflow-hidden bg-zinc-900/50 border border-white/10 backdrop-blur-3xl text-center flex flex-col items-center justify-center"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />

          <h2 className="font-jakarta text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 relative z-10 tracking-tighter uppercase leading-[0.9]">
            Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Build</span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl mb-10 relative z-10 max-w-2xl mx-auto font-medium tracking-tight">
            Ready to upgrade your web presence? Browse our packages, submit your requirements, and kickstart your build today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full sm:w-auto">
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="accent"
                className="rounded-full h-16 px-12 text-base font-bold hover:scale-105 transition-all w-full sm:w-auto"
              >
                Browse Pricing & Packages <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-16 px-10 text-base font-bold hover:bg-white/10 transition-all w-full sm:w-auto"
              >
                Contact Team
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <ShowcaseViewer
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
