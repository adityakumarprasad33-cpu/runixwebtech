"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Code, ShieldCheck, Users, Sparkles } from "lucide-react";
import RunixRealisticDeveloperHero from "@/components/hero/RunixRealisticDeveloperHero";
import { PageReadinessGate } from "@/components/readiness/PageReadinessGate";

const STUDIO_PILLARS = [
  {
    tag: "Pillar 01",
    title: "Engineering Discipline",
    desc: "We approach web development as formal software engineering. Clean architecture, robust type safety, and maintainable structure over hurried shortcuts.",
    icon: Code,
  },
  {
    tag: "Pillar 02",
    title: "Direct Technical Ownership",
    desc: "Clients collaborate directly with senior engineers who write the code. No middle management layers, no outsourced black boxes, no lost requirements.",
    icon: Users,
  },
  {
    tag: "Pillar 03",
    title: "Design Craft & Precision",
    desc: "Visual hierarchy, typography scaling, fluid micro-interactions, and responsive reflows are calibrated with care down to the pixel.",
    icon: Sparkles,
  },
  {
    tag: "Pillar 04",
    title: "Transparent Milestones",
    desc: "Zero speculative risk. We stage full interactive builds on private preview links before requesting final balance settlement or launch.",
    icon: ShieldCheck,
  },
];

export default function AboutPage() {
  return (
    <PageReadinessGate pagePath="/about">
      <div className="flex flex-col w-full items-center relative bg-[#F1F2F4] text-[#111317] overflow-x-clip min-h-screen">
        {/* Subtle dot grid */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-20" />

        {/* ── Hero ── */}
        <RunixRealisticDeveloperHero page="about" />

      {/* Narrative Section: Story & Approach */}
      <section className="py-20 lg:py-28 w-full max-w-[1200px] px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <span className="section-label mb-3 block">Our Story & Approach</span>
            <h2 className="text-3xl md:text-[2.5rem] font-semibold text-[#111317] tracking-tight leading-[1.15] mb-4">
              Software built by engineers who take pride in craft.
            </h2>
            <p className="text-[15px] text-[#4E5661] leading-relaxed mb-6">
              Runix Web Technologies was founded to bridge the gap between thoughtful product design and rigorous production software engineering.
            </p>
            <div className="p-5 rounded-xl bg-white border border-[rgba(17,19,23,0.08)] space-y-2.5 font-mono text-[12px] text-[#4E5661]">
              <div className="flex justify-between border-b border-[rgba(17,19,23,0.06)] pb-2">
                <span className="font-semibold text-[#111317]">STUDIO PRINCIPLES</span>
                <span className="text-[#169B62] font-medium">EST. 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B838E]">Primary Focus:</span>
                <span className="text-[#111317] font-medium">Web Apps, Platforms, Brand Sites</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B838E]">Engineering:</span>
                <span className="text-[#111317] font-medium">Next.js, TypeScript, React</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B838E]">Milestone Model:</span>
                <span className="text-[#315EF7] font-medium">50% Advance / 50% Staged</span>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7 flex flex-col gap-6">
            {[
              {
                title: "Products, not just web pages",
                text: "Rather than treating a website like an assembly of disconnected templates, we approach every build as a unified digital product system — where component hierarchy, state flow, asset payloads, and user journeys all serve measurable business goals.",
              },
              {
                title: "Engineering over buzzwords",
                text: "We avoid speculative design trends that compromise performance. We write semantic HTML, clean CSS design tokens, and lightweight frontend logic that loads fast and delivers high Lighthouse scores across all devices.",
              },
              {
                title: "Direct human collaboration",
                text: "When you start a project with Runix, you communicate directly with the engineers building your system. Requirements are understood precisely, iterations happen rapidly, and production releases happen on schedule.",
              },
              {
                title: "A calm, reliable partnership",
                text: "Whether you need a high-converting marketing website, an interactive SaaS platform, or an internal dashboard, our transparent sprint structure and staged previews eliminate uncertainty from day one.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="bg-white border border-[rgba(17,19,23,0.08)] rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(17,19,23,0.03)]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-[6px] bg-[#F1F2F4] border border-[rgba(17,19,23,0.06)] flex items-center justify-center text-[11px] font-mono font-medium text-[#315EF7]">
                    0{i + 1}
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#111317] tracking-tight">
                    {item.title}
                  </h3>
                </div>
                <p className="text-[14px] sm:text-[15px] text-[#4E5661] leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
          
        </div>
      </section>

      {/* Studio Pillars Grid */}
      <section className="py-20 w-full max-w-[1200px] px-6 sm:px-8 lg:px-16 relative z-10 border-t border-[rgba(17,19,23,0.08)]">
        <div className="mb-12">
          <span className="section-label mb-3 block">Operating Principles</span>
          <h2 className="text-3xl md:text-[2.5rem] font-semibold text-[#111317] tracking-tight">
            How we operate every sprint.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STUDIO_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-[rgba(17,19,23,0.08)] rounded-xl p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(17,19,23,0.03)]"
              >
                <div>
                  <div className="w-10 h-10 rounded-[8px] bg-[#F1F2F4] text-[#111317] flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-[#315EF7]" />
                  </div>
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#7B838E] block mb-1.5">
                    {pillar.tag}
                  </span>
                  <h3 className="text-base font-semibold text-[#111317] mb-2 tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="text-[13px] text-[#4E5661] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 w-full px-6 sm:px-8 lg:px-16 relative z-10 bg-[#E8EAED] border-t border-[rgba(17,19,23,0.08)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-[1200px] mx-auto text-center"
        >
          <span className="section-label mb-3 block">
            New Projects Welcomed
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#111317] mb-4 tracking-tight">
            Build your next product with Runix.
          </h2>
          <p className="text-[15px] sm:text-base text-[#4E5661] mb-8 max-w-xl mx-auto leading-relaxed">
            Whether your website needs a complete redesign or you are launching a brand-new digital venture, let&apos;s build it properly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/services">
              <Button
                size="lg"
                className="rounded-[8px] h-11 px-6 text-[14px] font-medium bg-[#111317] hover:bg-[#1C1F26] text-white flex items-center gap-2"
              >
                View Services & Pricing <ArrowRight className="w-3.5 h-3.5" />
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

    </div>
    </PageReadinessGate>
  );
}
