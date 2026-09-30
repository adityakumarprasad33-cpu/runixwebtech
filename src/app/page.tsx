"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { type Project, projects as defaultProjects } from "@/data/projects";

import RunixRealisticDeveloperHero from "@/components/hero/RunixRealisticDeveloperHero";
import { PageReadinessGate } from "@/components/readiness/PageReadinessGate";

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

  const displayProjects = dbProjects.length > 0 ? dbProjects : defaultProjects;

  return (
    <PageReadinessGate pagePath="/">
      <div className="flex flex-col w-full items-center bg-[#F1F2F4] text-[#111317] overflow-x-clip">
        {/* Subtle dot grid background */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-20" />

      {/* ── Hero Section ── */}
      <RunixRealisticDeveloperHero page="home" />

      {/* ── 01. Selected Works ── */}
      <section id="work" className="w-full px-6 sm:px-8 lg:px-16 py-24 sm:py-32 relative z-10 bg-white border-t border-[rgba(17,19,23,0.06)] lazy-render">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-14 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
              <span className="section-label mb-3 block">Selected Work</span>
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="text-3xl md:text-[2.75rem] font-semibold text-[#111317] tracking-tight leading-[1.1]"
              >
                Projects we&apos;re proud of.
              </motion.h2>
              <p className="text-[#4B5563] text-[15px] mt-3 max-w-md leading-relaxed">
                Web applications, platforms, and digital products built for real businesses.
              </p>
            </div>

            <Link href="/work">
              <Button
                variant="outline"
                className="rounded-[8px] h-10 px-5 text-[14px] font-medium flex items-center gap-2"
              >
                All Projects
                <ArrowRight className="w-3.5 h-3.5 text-[#315EF7]" />
              </Button>
            </Link>
          </div>

          {/* Large Visual Case Studies (Editorial Layout) */}
          <div className="flex flex-col gap-12 sm:gap-16">
            {displayProjects.slice(0, 2).map((project, idx) => (
              <motion.article
                key={project.id || project.slug || `home-proj-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white border border-[rgba(17,19,23,0.08)] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(17,19,23,0.03)] grid grid-cols-1 lg:grid-cols-12 cursor-pointer group"
                onClick={() => setSelectedProject(project)}
              >
                {/* Visual Window (7 cols on desktop) */}
                <div className="lg:col-span-7 bg-[#E8EAED] border-b lg:border-b-0 lg:border-r border-[rgba(17,19,23,0.08)] relative aspect-[16/10] overflow-hidden flex flex-col">
                  {/* Browser Chrome Header */}
                  <div className="h-9 px-4 bg-[#F1F2F4] border-b border-[rgba(17,19,23,0.06)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[rgba(17,19,23,0.18)]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[rgba(17,19,23,0.18)]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[rgba(17,19,23,0.18)]" />
                    </div>
                    <div className="px-3 py-0.5 rounded bg-white text-[11px] font-mono text-[#5A626E] border border-[rgba(17,19,23,0.06)] max-w-[200px] truncate">
                      {project.live_url || `${project.slug}.runix.in`}
                    </div>
                    <div className="w-6" />
                  </div>

                  {/* Visual Content */}
                  <div className="flex-1 relative bg-[#F8F9FA] flex items-center justify-center p-6 overflow-hidden">
                    {project.thumbnail ? (
                      <div className="relative w-full h-full rounded shadow-sm overflow-hidden bg-white border border-[rgba(17,19,23,0.06)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full rounded bg-white border border-[rgba(17,19,23,0.06)] p-6 flex flex-col justify-between">
                        <span className="text-[12px] font-mono text-[#7B838E]">{project.category}</span>
                        <div className="space-y-2">
                          <h4 className="text-xl font-semibold text-[#111317]">{project.title}</h4>
                          <p className="text-xs text-[#5A626E] line-clamp-2">{project.summary}</p>
                        </div>
                        <span className="text-[11px] text-[#315EF7] font-medium inline-flex items-center gap-1">
                          View details <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editorial Details (5 cols on desktop) */}
                <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between bg-white">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="section-label">
                        {project.category || "Web App"}
                      </span>
                      <span className="text-[12px] font-mono text-[#7B838E]">
                        {project.year || "2026"}
                      </span>
                    </div>

                    <h3 className="text-2xl font-semibold text-[#111317] mb-3 tracking-tight group-hover:text-[#315EF7] transition-colors">
                      {project.title}
                    </h3>

                    <p className="text-[15px] text-[#4E5661] leading-relaxed mb-5">
                      {project.summary}
                    </p>

                    {project.problem_solved && (
                      <div className="p-3.5 rounded-[8px] bg-[#F8F9FA] border border-[rgba(17,19,23,0.06)] mb-6">
                        <span className="text-[11px] font-mono font-medium text-[#7B838E] uppercase tracking-wider block mb-1">
                          Outcome
                        </span>
                        <p className="text-[13px] text-[#2D3339] leading-snug">
                          {project.problem_solved}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[rgba(17,19,23,0.06)] flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {project.stack?.slice(0, 3).map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded bg-[#F1F2F4] text-[11px] font-mono text-[#4E5661]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <span className="text-[13px] font-medium text-[#111317] group-hover:text-[#315EF7] inline-flex items-center gap-1.5 transition-colors">
                      Case Study
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 02. What We Do ── */}
      <section className="w-full max-w-[1200px] px-6 sm:px-8 lg:px-16 py-24 sm:py-32 relative z-10 border-t border-[rgba(17,19,23,0.06)] lazy-render">
        <div className="flex flex-col lg:flex-row gap-16 justify-between">
          <div className="lg:w-1/3">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="sticky top-32 space-y-4"
            >
              <span className="section-label">What We Do</span>
              <h2 className="text-3xl md:text-[2.75rem] font-semibold text-[#111317] tracking-tight leading-[1.1]">
                Full-stack<br />engineering.
              </h2>
              <p className="text-[#4B5563] text-[15px] leading-relaxed max-w-sm">
                We handle the entire product lifecycle — from architecture to deployment — so you can focus on your business.
              </p>
            </motion.div>
          </div>

          <div className="lg:w-2/3 flex flex-col gap-0">
            {[
              {
                num: "01",
                title: "Web Applications",
                desc: "Production-grade web apps built with modern frameworks. Real-time data, authentication, payments, and everything your users need.",
              },
              {
                num: "02",
                title: "Platforms & Dashboards",
                desc: "Admin panels, client portals, and data-dense operational tools. Built for scale and designed for the humans who use them.",
              },
              {
                num: "03",
                title: "Brand Websites",
                desc: "High-converting landing pages, corporate presences, and portfolio sites that establish credibility at first glance.",
              },
            ].map((service, i) => (
              <motion.div
                key={service.num}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="group border-b border-[rgba(17,19,23,0.08)] py-8 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="flex items-baseline gap-5 mb-2">
                  <span className="text-sm font-medium text-[#6B7280] font-mono tabular-nums">
                    {service.num}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#111317] group-hover:text-[#315EF7] transition-colors duration-150 tracking-tight">
                    {service.title}
                  </h3>
                </div>
                <p className="text-[15px] text-[#4B5563] ml-10 max-w-xl leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 03. How We Work ── */}
      <section className="w-full px-6 sm:px-8 lg:px-16 py-24 sm:py-32 relative z-10 border-t border-[rgba(17,19,23,0.06)] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-14">
            <span className="section-label mb-3 block">Process</span>
            <h2 className="text-3xl md:text-[2.75rem] font-semibold text-[#111317] tracking-tight leading-[1.1]">
              How we deliver.
            </h2>
            <p className="text-[#4B5563] text-[15px] mt-3 max-w-lg leading-relaxed">
              Transparent milestones, private staging previews, and zero handoff surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Scope & Spec",
                desc: "We understand your requirements, define the architecture, and set clear sprint deadlines.",
                badge: "Day 0",
              },
              {
                step: "02",
                title: "50% Advance & Build",
                desc: "Development begins on 50% deposit. You get access to a private developer room with live progress.",
                badge: "Days 1–7",
              },
              {
                step: "03",
                title: "Staging & QA",
                desc: "We deploy to a private staging URL. You test, interact, and request revisions before approval.",
                badge: "Review",
              },
              {
                step: "04",
                title: "50% Balance & Handover",
                desc: "Once approved, settle the balance. We transfer full source code, DNS, and production access.",
                badge: "Launch",
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#F8F9FA] border border-[rgba(17,19,23,0.06)] hover:border-[rgba(17,19,23,0.12)] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono font-medium text-[#6B7280]">{p.step}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#E5E7EB] text-[#111317] font-medium">
                      {p.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#111317] mb-2">{p.title}</h3>
                  <p className="text-[13px] text-[#4B5563] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 04. Technology ── */}
      <section className="w-full max-w-[1200px] px-6 sm:px-8 lg:px-16 py-24 sm:py-32 relative z-10 border-t border-[rgba(17,19,23,0.06)]">
        <div className="mb-14">
          <span className="section-label mb-3 block">Technology</span>
          <h2 className="text-3xl md:text-[2.75rem] font-semibold text-[#111317] tracking-tight leading-[1.1]">
            Modern stack. No shortcuts.
          </h2>
          <p className="text-[#4B5563] text-[15px] mt-3 max-w-lg leading-relaxed">
            We build with production-proven tools that scale with your business.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: "Next.js", role: "Framework" },
            { name: "React", role: "UI Engine" },
            { name: "TypeScript", role: "Type Safety" },
            { name: "Three.js", role: "3D / WebGL" },
            { name: "Tailwind CSS", role: "Styling" },
            { name: "Firebase", role: "Backend" },
          ].map((tech, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-white border border-[rgba(17,19,23,0.06)] hover:border-[rgba(17,19,23,0.12)] transition-all duration-200"
            >
              <span className="text-[10px] font-mono text-[#6B7280] uppercase block mb-1">{tech.role}</span>
              <h4 className="text-sm font-semibold text-[#111317] tracking-tight">{tech.name}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* ── 05. Trust — 50/50 Payment ── */}
      <section className="py-24 sm:py-32 w-full max-w-[1200px] px-6 sm:px-8 lg:px-16 relative z-10 border-t border-[rgba(17,19,23,0.06)]">
        <div className="rounded-2xl p-8 sm:p-12 md:p-14 bg-white border border-[rgba(17,19,23,0.08)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="space-y-4 max-w-xl">
            <span className="section-label">Client Protection</span>
            <h2 className="text-2xl md:text-4xl font-semibold text-[#111317] tracking-tight leading-[1.1]">
              Pay 50% to start.{" "}
              <span className="text-[#315EF7]">
                50% on delivery.
              </span>
            </h2>
            <p className="text-[#4B5563] text-[15px] leading-relaxed">
              No full upfront payment. We build, stage a private preview for you to test, and you settle the balance only when you&apos;re satisfied.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-[12px] font-mono text-[#4B5563]">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#169B62]" /> Milestone escrow</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#315EF7]" /> Sprint SLA</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#6B7280]" /> Private staging</span>
            </div>
          </div>

          <Link href="/pricing" className="shrink-0">
            <Button
              variant="primary"
              size="lg"
              className="rounded-[8px] h-11 px-6 text-[14px] font-medium flex items-center gap-2"
            >
              View Pricing <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="w-full pb-28 px-6 sm:px-8 lg:px-16 relative z-10 lazy-render">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[1200px] mx-auto rounded-2xl p-10 md:p-16 bg-[#111317] text-center flex flex-col items-center justify-center"
        >
          <span className="section-label text-[#6B7280] mb-4">
            Start a Project
          </span>
          <h2 className="text-3xl sm:text-5xl font-semibold text-white mb-5 tracking-tight leading-[1.1]">
            Build something people remember.
          </h2>
          <p className="text-[#9CA3AF] text-[15px] sm:text-[16px] mb-8 max-w-md mx-auto leading-relaxed">
            Browse our packages, configure your scope, and kickstart your build with senior engineers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/pricing">
              <Button
                variant="primary"
                size="lg"
                className="rounded-[8px] h-11 px-6 text-[14px] font-medium w-full sm:w-auto"
              >
                Browse Pricing <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="ghost"
                className="rounded-[8px] h-11 px-5 text-[14px] font-medium text-white/80 hover:text-white hover:bg-white/10 w-full sm:w-auto"
              >
                Contact Us
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
    </PageReadinessGate>
  );
}
