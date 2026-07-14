"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Code, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ShowcaseViewer from "@/components/showcase/ShowcaseViewer";
import { type Project } from "@/data/projects";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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

  const featuredProjects = dbProjects.filter((p) => p.featured).slice(0, 4);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="flex flex-col w-full items-center bg-[#050505] overflow-hidden">
      
      {/* Background Abstract */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1] 
          }}
          transition={{ 
            duration: 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-indigo-600/10 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            rotate: [360, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{ 
            duration: 40, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-purple-600/10 blur-[100px] translate-x-1/4 -translate-y-1/4"
        />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-20" />

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-32 pb-24 px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto w-full flex flex-col items-center text-center"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-12 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em]">The New Standard</span>
          </motion.div>
          
          <h1 className="font-jakarta text-7xl md:text-[8rem] lg:text-[10rem] text-white tracking-tighter mb-8 leading-[0.85] font-black uppercase text-glow">
            Digital<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 via-white to-zinc-500">Mastery</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-zinc-400 max-w-3xl mx-auto mb-16 font-medium leading-relaxed tracking-tight">
            We engineer immersive digital experiences that command attention, evoke emotion, and drive undeniable results.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
            <Link href="/contact" className="w-full sm:w-auto">
              <Button size="lg" variant="default" className="w-full sm:w-auto h-16 px-10 text-lg">
                Start Your Project
              </Button>
            </Link>
            <Link href="/work" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg border-white/20 hover:border-white/40">
                Explore Work
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Services / Avant-Garde List */}
      <section className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-32 relative z-10 border-t border-white/5 mt-20">
        <div className="flex flex-col lg:flex-row gap-16 justify-between">
          <div className="lg:w-1/3">
            <motion.h2 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-jakarta text-5xl md:text-7xl font-extrabold text-white tracking-tighter sticky top-32"
            >
              Our<br/>Expertise.
            </motion.h2>
          </div>
          
          <div className="lg:w-2/3 flex flex-col gap-12">
            {[
              { num: "01", title: "Immersive Web Design", desc: "Pushing the boundaries of the browser with WebGL, advanced animations, and art-directed layouts." },
              { num: "02", title: "Full-Stack Platforms", desc: "Architecting scalable, high-performance web applications using modern stacks like Next.js and React." },
              { num: "03", title: "Premium E-Commerce", desc: "Crafting bespoke shopping experiences that elevate your brand and maximize conversions." },
            ].map((service, i) => (
              <motion.div 
                key={service.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group border-b border-white/10 pb-12"
              >
                <div className="flex items-baseline gap-6 mb-6">
                  <span className="text-2xl font-bold text-zinc-600 font-jakarta">{service.num}</span>
                  <h3 className="font-jakarta text-4xl md:text-5xl font-bold text-white group-hover:text-indigo-400 transition-colors duration-500 tracking-tight">{service.title}</h3>
                </div>
                <p className="text-xl text-zinc-400 ml-14 max-w-xl leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Work - Large High-Contrast Cards */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-32 relative z-10 bg-[#030303]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 flex flex-col md:flex-row items-end justify-between gap-8">
            <motion.h2 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-jakarta text-5xl md:text-7xl font-extrabold text-white tracking-tighter"
            >
              Selected<br/>Works
            </motion.h2>
            <Link href="/work">
              <Button variant="outline" className="rounded-full flex items-center gap-2 h-14 px-8 border-white/20 hover:border-white">
                View Archive
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-16 md:gap-32">
            {featuredProjects.map((project, i) => (
              <motion.div
                key={project.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 md:gap-16 items-center`}
              >
                <div 
                  className="w-full md:w-3/5 aspect-[4/3] rounded-[2rem] overflow-hidden cursor-pointer group relative bg-zinc-900"
                  onClick={() => setSelectedProject(project)}
                >
                  {/* Subtle noise/gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-black/20 z-10 opacity-60 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
                  
                  {/* Hover reveal text */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm tracking-widest uppercase scale-0 group-hover:scale-100 transition-transform duration-500 ease-out shadow-2xl">
                      Full View
                    </div>
                  </div>
                  
                  {/* Project Image or Iframe */}
                  {project.live_url ? (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none transition-transform duration-1000 group-hover:scale-105">
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
                    <div className="w-full h-full bg-zinc-800 transition-transform duration-1000 group-hover:scale-105" />
                  )}
                </div>
                
                <div className="w-full md:w-2/5 flex flex-col items-start">
                  <div className="flex gap-3 mb-6">
                    <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 uppercase tracking-widest">
                      {project.category}
                    </span>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black font-jakarta text-white mb-6 tracking-tight leading-tight">{project.title}</h3>
                  <p className="text-lg text-zinc-400 mb-8 leading-relaxed">{project.summary}</p>
                  <button 
                    onClick={() => setSelectedProject(project)}
                    className="group flex items-center gap-3 text-white font-bold tracking-widest uppercase text-sm"
                  >
                    Explore Case
                    <span className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Massive CTA */}
      <section className="w-full min-h-[80vh] flex items-center justify-center px-4 py-32 relative z-10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-7xl mx-auto rounded-[3rem] p-12 md:p-24 relative overflow-hidden bg-zinc-900/50 border border-white/5 backdrop-blur-3xl text-center flex flex-col items-center justify-center"
        >
          {/* Inner glowing core */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          <h2 className="font-jakarta text-6xl md:text-8xl lg:text-[9rem] font-black text-white mb-10 relative z-10 tracking-tighter uppercase leading-[0.85]">
            Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Build</span>
          </h2>
          <p className="text-zinc-400 text-xl md:text-2xl mb-16 relative z-10 max-w-2xl mx-auto font-medium tracking-tight">
            Ready to push boundaries? Let's craft a digital experience that leaves your competition in the dust.
          </p>
          <Link href="/contact" className="relative z-10 w-full sm:w-auto">
            <Button size="lg" variant="default" className="rounded-full h-20 px-16 text-xl shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:scale-105 w-full sm:w-auto">
              Start The Conversation
            </Button>
          </Link>
        </motion.div>
      </section>

      <ShowcaseViewer project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
