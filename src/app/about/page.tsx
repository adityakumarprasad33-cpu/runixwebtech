"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";

export default function AboutPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="flex flex-col w-full items-center relative bg-[#050505] overflow-hidden">
      
      {/* Background Abstract */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <motion.div 
          animate={{ 
            rotate: [360, 0],
            scale: [1, 1.3, 1] 
          }}
          transition={{ 
            duration: 40, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-zinc-800/10 blur-[120px] -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-10" />

      {/* Hero Section */}
      <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-center pt-32 pb-16 px-4 z-10 border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto w-full text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em]">Our Philosophy</span>
          </div>
          
          <h1 className="font-jakarta text-6xl md:text-8xl lg:text-[9rem] text-white tracking-tighter mb-8 leading-[0.85] font-black uppercase text-glow">
            Who We <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-white">Are</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
            We don't just build websites. We engineer digital products that set the standard.
          </p>
        </motion.div>
      </section>

      {/* Narrative Section */}
      <section className="py-32 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          
          <div className="md:w-1/2 sticky top-32">
            <h2 className="font-jakarta text-4xl md:text-6xl font-extrabold text-white tracking-tighter mb-8">
              The Vision.
            </h2>
            <div className="w-full aspect-square bg-zinc-900 rounded-[2rem] overflow-hidden relative border border-white/5">
               {/* Image Placeholder */}
               <div className="absolute inset-0 bg-gradient-to-tr from-black/80 to-transparent z-10" />
               <motion.div 
                 style={{ y }}
                 className="absolute -inset-10 bg-zinc-800"
               />
            </div>
          </div>
          
          <div className="md:w-1/2 flex flex-col gap-16 md:pt-32">
            {[
              "The goal behind Runix Web Technologies is straightforward: build digital products that look premium, work smoothly, and reflect the quality of the people or businesses behind them.",
              "Rather than treating a website like a set of random pages, the work is approached like a real product system — where layout, responsiveness, structure, and user experience all matter.",
              "Whether it’s a business website, a startup landing page, a dashboard, or an MVP interface, the aim is to deliver something that feels intentional and worth using.",
              "We are especially interested in projects that need a stronger visual presence, better structure, and a more polished digital experience."
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-xl md:text-2xl text-zinc-400 leading-relaxed font-medium"
              >
                {text}
              </motion.div>
            ))}
          </div>
          
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 w-full max-w-7xl px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[3rem] p-16 relative overflow-hidden bg-zinc-900/50 border border-white/5 backdrop-blur-3xl"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <h2 className="font-jakarta text-5xl md:text-7xl font-black text-white mb-6 relative z-10 tracking-tighter uppercase">
            Time for an upgrade?
          </h2>
          <p className="text-xl text-zinc-400 mb-10 relative z-10 max-w-2xl mx-auto leading-relaxed">
            If your current website feels outdated, generic, or not aligned with your brand, it might be time to rebuild it properly.
          </p>
          <Link href="/services#pricing" className="relative z-10">
            <Button size="lg" variant="default" className="rounded-full h-16 px-12 text-lg shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105">
              View Our Services
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
