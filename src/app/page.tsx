"use client";

import { useState, useEffect } from "react";
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
import ShowcaseViewer from "@/components/showcase/ShowcaseViewer";
import { type Project, projects as defaultProjects } from "@/data/projects";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [heroStats, setHeroStats] = useState({
    stat1Value: "50+", stat1Label: "PROJECTS COMPLETED",
    stat2Value: "100%", stat2Label: "CLIENT SATISFACTION",
    stat3Value: "< 2 Wks", stat3Label: "AVERAGE DELIVERY",
    stat4Value: "Next.js 16", stat4Label: "MODERN STACK",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "projects"));
        const data = snap.docs.map((doc) => doc.data() as Project);
        if (data.length > 0) {
          setDbProjects(data);
        } else {
          setDbProjects(defaultProjects);
        }
      } catch (e) {
        setDbProjects(defaultProjects);
      }

      try {
        const docSnap = await getDoc(doc(db, "settings", "hero_stats"));
        if (docSnap.exists()) {
          const d = docSnap.data();
          setHeroStats({
            stat1Value: d.stat1Value || "50+", stat1Label: d.stat1Label || "PROJECTS COMPLETED",
            stat2Value: d.stat2Value || "100%", stat2Label: d.stat2Label || "CLIENT SATISFACTION",
            stat3Value: d.stat3Value || "< 2 Wks", stat3Label: d.stat3Label || "AVERAGE DELIVERY",
            stat4Value: d.stat4Value || "Next.js 16", stat4Label: d.stat4Label || "MODERN STACK",
          });
        }
      } catch (e) {
        console.error("Error fetching hero stats:", e);
      }
    };
    fetchData();
  }, []);

  const displayProjects = dbProjects.length > 0 ? dbProjects : defaultProjects;

  return (
    <div className="flex flex-col w-full items-center bg-[#050505] overflow-hidden">
      {/* Background Abstract Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-indigo-600/10 blur-[140px] animate-pulse" />
        <div className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-purple-600/10 blur-[120px] translate-x-1/4 -translate-y-1/4" />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-20" />

      {/* ── Hero Section ── */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-36 pb-20 px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto w-full flex flex-col items-center text-center"
        >
          {/* Trust Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-[0_0_25px_rgba(99,102,241,0.15)]"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em]">
              Next-Gen Web Agency
            </span>
          </motion.div>

          <h1 className="font-jakarta text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] text-white tracking-tighter mb-8 leading-[0.85] font-black uppercase text-glow">
            Digital<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400">
              Engineering
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed tracking-tight">
            Runix Web Tech designs and develops bespoke websites, high-performance web applications, and custom admin dashboards engineered to grow your business.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="accent"
                className="w-full sm:w-auto h-16 px-10 text-lg rounded-full shadow-[0_0_35px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)]"
              >
                Start Your Project <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/work" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-16 px-10 text-lg border-white/20 hover:border-white/40 rounded-full"
              >
                Explore Works
              </Button>
            </Link>
          </div>

          {/* Social Proof & Trust Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mt-20 pt-12 border-t border-white/10 w-full max-w-4xl">
            {[
              { label: heroStats.stat1Label, value: heroStats.stat1Value, icon: Award },
              { label: heroStats.stat2Label, value: heroStats.stat2Value, icon: ShieldCheck },
              { label: heroStats.stat3Label, value: heroStats.stat3Value, icon: Zap },
              { label: heroStats.stat4Label, value: heroStats.stat4Value, icon: Layers },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                className="flex flex-col items-center text-center p-3"
              >
                <stat.icon className="w-5 h-5 text-indigo-400 mb-2" />
                <span className="text-2xl md:text-3xl font-black text-white font-jakarta">
                  {stat.value}
                </span>
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-1">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── What We Do / Services Highlights ── */}
      <section className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-28 relative z-10 border-t border-white/5">
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
                desc: "High-converting, mobile-perfect websites crafted with custom UI tokens, sleek dark modes, and glassmorphism detail.",
              },
              {
                num: "02",
                title: "Full-Stack Web Applications",
                desc: "Scalable MVPs and custom software built with React 19, Next.js, and secure cloud authentication.",
              },
              {
                num: "03",
                title: "Custom Dashboards & Panels",
                desc: "Data-driven admin interfaces, role-based controls, and real-time operational workflows.",
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
      <section className="w-full px-4 sm:px-6 lg:px-8 py-28 relative z-10 bg-[#030303]">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayProjects.slice(0, 4).map((project) => (
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

                {/* Styled Visual UI Preview Card (Lightweight) */}
                <div className="w-full h-48 bg-zinc-900/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between group-hover:bg-zinc-800/80 transition-colors">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="text-[10px] text-zinc-500 font-mono ml-2 truncate">
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
        </div>
      </section>

      {/* ── Final Call to Action ── */}
      <section className="w-full min-h-[70vh] flex items-center justify-center px-4 py-24 relative z-10 overflow-hidden">
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
          <p className="text-zinc-400 text-lg md:text-xl mb-12 relative z-10 max-w-2xl mx-auto font-medium tracking-tight">
            Ready to upgrade your web presence? Submit your project requirements in your dashboard and get started today.
          </p>
          <Link href="/contact" className="relative z-10 w-full sm:w-auto">
            <Button
              size="lg"
              variant="accent"
              className="rounded-full h-16 px-14 text-lg shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:scale-105 transition-all w-full sm:w-auto"
            >
              Start The Conversation <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <ShowcaseViewer
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
