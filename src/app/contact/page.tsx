"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Mail, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="flex flex-col w-full items-center relative bg-[#050505] overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-10" />

      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[50vh] bg-indigo-500/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <section className="relative w-full pt-48 pb-16 px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto w-full text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em]">
              Contact
            </span>
          </div>

          <h1 className="font-jakarta text-6xl md:text-8xl lg:text-[9rem] text-white tracking-tighter mb-8 leading-[0.85] font-black uppercase text-glow">
            Get In{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              Touch
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
            For project inquiries, use your dashboard. For general questions
            or direct communication, reach out below.
          </p>
        </motion.div>
      </section>

      {/* Contact Cards Section */}
      <section className="py-16 w-full max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Card */}
          <motion.a
            href="mailto:hello@runixtech.com"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="group premium-card bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-10 relative overflow-hidden hover:border-indigo-500/30 transition-all cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                <Mail className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                Email
              </h3>
              <p className="text-2xl md:text-3xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all tracking-tight break-all">
                hello@runixtech.com
              </p>
              <p className="text-zinc-500 text-sm mt-4 leading-relaxed">
                For serious inquiries, include as much context as possible
                about your project.
              </p>
            </div>
          </motion.a>

          {/* WhatsApp Card */}
          <motion.a
            href="https://wa.me/1234567890"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group premium-card bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-10 relative overflow-hidden hover:border-emerald-500/30 transition-all cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                WhatsApp
              </h3>
              <p className="text-2xl md:text-3xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-400 group-hover:to-teal-400 transition-all tracking-tight">
                +91 98765 43210
              </p>
              <p className="text-zinc-500 text-sm mt-4 leading-relaxed">
                Quick questions or real-time discussions. We typically reply
                within a few hours.
              </p>
            </div>
          </motion.a>
        </div>

        {/* Dashboard CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 premium-card bg-gradient-to-r from-indigo-900/30 to-purple-900/20 backdrop-blur-xl border border-indigo-500/20 rounded-[2rem] p-8 md:p-10 text-center"
        >
          <h3 className="font-jakarta text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
            Ready to start a project?
          </h3>
          <p className="text-zinc-400 text-base mb-8 max-w-lg mx-auto">
            Submit your requirements, choose a budget tier, and make payment
            — all from your dashboard.
          </p>
          <Link href="/dashboard">
            <Button
              variant="accent"
              size="lg"
              className="rounded-full h-14 px-8 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
            >
              Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
