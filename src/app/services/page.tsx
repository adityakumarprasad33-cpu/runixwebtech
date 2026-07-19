"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { services } from "@/data/services";
import Link from "next/link";

export default function ServicesPage() {
  return (
    <div className="flex flex-col w-full items-center relative bg-[#050505] overflow-hidden">
      
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
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em]">Capabilities</span>
          </div>
          
          <h1 className="font-jakarta text-6xl md:text-8xl lg:text-[9rem] text-white tracking-tighter mb-8 leading-[0.85] font-black uppercase text-glow">
            What We <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Do</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
            Focused web development services for brands that demand a premium online presence.
          </p>
        </motion.div>
      </section>

      {/* Services List */}
      <section className="py-32 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col gap-16 md:gap-32">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start"
            >
              <div className="lg:col-span-5 sticky top-32">
                <span className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Service 0{index + 1}
                </span>
                <h2 className="font-jakarta text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
                  {service.title}
                </h2>
                <p className="text-xl text-zinc-400 leading-relaxed font-medium">
                  {service.summary}
                </p>
              </div>
              
              <div className="lg:col-span-7 premium-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden bg-zinc-900/50 backdrop-blur-xl border border-white/10 group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="relative z-10 mb-12">
                  <h3 className="font-bold text-xs tracking-widest text-zinc-500 uppercase mb-8 pb-4 border-b border-white/10">
                    Ideal For
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {service.idealFor.map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-zinc-300">
                        <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0" />
                        <span className="text-base font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative z-10 mb-12">
                  <h3 className="font-bold text-xs tracking-widest text-zinc-500 uppercase mb-8 pb-4 border-b border-white/10">
                    What's Included
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {service.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-zinc-300">
                        <span className="w-2 h-2 rounded-full bg-zinc-600 shrink-0 mt-2" />
                        <span className="text-base font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 w-full px-4 sm:px-6 lg:px-8 relative z-10 bg-[#020202] border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="font-jakarta text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-6">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Start?</span>
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Head to your dashboard to submit project requirements, choose a budget tier, and get started with development.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="accent" size="lg" className="rounded-full h-16 px-10 text-lg shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]">
                Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="rounded-full h-16 px-10 text-lg border-white/20">
                Contact Us
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
