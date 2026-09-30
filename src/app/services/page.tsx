"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Cpu,
  Database,
  ShieldCheck,
  Rocket,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { services } from "@/data/services";
import RunixRealisticDeveloperHero from "@/components/hero/RunixRealisticDeveloperHero";
import { PageReadinessGate } from "@/components/readiness/PageReadinessGate";

interface ArchitectureNode {
  id: string;
  name: string;
  category: string;
  description: string;
  tech: string[];
  specs: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ARCHITECTURE_PIPELINE: ArchitectureNode[] = [
  {
    id: "frontend",
    name: "User Interface",
    category: "CLIENT EXPERIENCE",
    description: "Responsive Next.js applications engineered with fluid micro-interactions, clean semantic layout, and fast render times.",
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    specs: "Core Web Vitals • Mobile Optimized",
    icon: Code2,
  },
  {
    id: "api",
    name: "Application Logic",
    category: "BUSINESS LOGIC LAYER",
    description: "Type-safe APIs and backend services designed for fast response, robust input validation, and clean error handling.",
    tech: ["Serverless Edge", "TypeScript", "REST APIs", "Zod Validation"],
    specs: "Type-Safe Contracts • Low Latency",
    icon: Cpu,
  },
  {
    id: "database",
    name: "Data & Storage",
    category: "DATA ARCHITECTURE",
    description: "Reliable database schemas with structured relations, automated backup strategies, and real-time state synchronization.",
    tech: ["PostgreSQL", "Firestore", "Redis", "Prisma"],
    specs: "Structured Schemas • Safe Migrations",
    icon: Database,
  },
  {
    id: "auth",
    name: "Security & Auth",
    category: "ACCESS CONTROL",
    description: "User authentication, role-based authorization, session security, and defense-in-depth protection across all endpoints.",
    tech: ["OAuth 2.0", "Firebase Auth / NextAuth", "Role-Based Access", "CSRF Protection"],
    specs: "Encrypted Sessions • Strict RBAC",
    icon: ShieldCheck,
  },
  {
    id: "deployment",
    name: "Infrastructure",
    category: "CLOUD DELIVERY",
    description: "Automated continuous delivery, global Anycast CDN edge networks, and zero-downtime deployment pipelines.",
    tech: ["Vercel Edge", "Cloudflare", "GitHub Actions", "Staging Environments"],
    specs: "Automated CI/CD • Instant Rollback",
    icon: Rocket,
  },
];

export default function ServicesPage() {
  const [activeNode, setActiveNode] = useState<string>("frontend");
  const selectedNode =
    ARCHITECTURE_PIPELINE.find((n) => n.id === activeNode) ||
    ARCHITECTURE_PIPELINE[0];

  return (
    <PageReadinessGate pagePath="/services">
      <div className="flex flex-col w-full items-center relative bg-[#F1F2F4] text-[#111317] overflow-x-clip min-h-screen">
        {/* Subtle dot grid */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-20" />

        {/* ── Hero ── */}
        <RunixRealisticDeveloperHero page="services" />

      {/* ── 01. Services Explained in Human Language ── */}
      <section className="py-20 lg:py-28 w-full max-w-[1200px] px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="max-w-2xl mb-14">
          <span className="section-label mb-3 block">What We Deliver</span>
          <h2 className="text-3xl md:text-[2.5rem] font-semibold text-[#111317] tracking-tight leading-[1.15]">
            Digital products built for your business.
          </h2>
          <p className="text-[#4E5661] text-[15px] mt-3 leading-relaxed">
            Every engagement is structured around real business objectives. We design the interface, engineer the codebase, and manage deployment end-to-end.
          </p>
        </div>

        <div className="flex flex-col gap-12 lg:gap-16">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start border-b border-[rgba(17,19,23,0.08)] pb-14 last:border-b-0 last:pb-0"
            >
              <div className="lg:col-span-5 lg:sticky lg:top-28">
                <span className="section-label mb-2 block">
                  Service 0{index + 1}
                </span>
                <h3 className="text-2xl sm:text-3xl font-semibold text-[#111317] mb-3 tracking-tight leading-snug">
                  {service.title}
                </h3>
                <p className="text-[15px] text-[#4E5661] leading-relaxed mb-6">
                  {service.summary}
                </p>
                <div>
                  <Link href="/pricing">
                    <Button
                      size="default"
                      className="rounded-[8px] bg-[#111317] text-white hover:bg-[#1C1F26] px-5 text-[14px] font-medium flex items-center gap-2"
                    >
                      Configure & Pricing
                      <ArrowRight className="w-3.5 h-3.5 text-[#315EF7]" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 bg-white border border-[rgba(17,19,23,0.08)] rounded-xl p-6 sm:p-8 space-y-6">
                <div>
                  <h4 className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#7B838E] uppercase mb-4 pb-2 border-b border-[rgba(17,19,23,0.06)]">
                    Ideal For
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {service.idealFor.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[#111317]">
                        <CheckCircle2 className="w-4 h-4 text-[#169B62] shrink-0 mt-0.5" />
                        <span className="text-[13px] leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#7B838E] uppercase mb-4 pb-2 border-b border-[rgba(17,19,23,0.06)]">
                    What&apos;s Included
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {service.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[#4E5661]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#315EF7] shrink-0 mt-2" />
                        <span className="text-[13px] leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 02. Architecture Pipeline (Technology Details Come Later) ── */}
      <section className="py-20 lg:py-28 w-full max-w-[1200px] px-6 sm:px-8 lg:px-16 relative z-10 border-t border-[rgba(17,19,23,0.08)]">
        <div className="max-w-2xl mb-12">
          <span className="section-label mb-3 block">Engineering Depth</span>
          <h2 className="text-3xl md:text-[2.5rem] font-semibold text-[#111317] tracking-tight leading-[1.15]">
            How we engineer digital products.
          </h2>
          <p className="text-[#4E5661] text-[15px] mt-3 leading-relaxed">
            Every product we build follows a structured, modular engineering approach from interface design to cloud deployment.
          </p>
        </div>

        {/* Interactive Architecture Strip */}
        <div className="bg-white border border-[rgba(17,19,23,0.08)] rounded-xl p-6 lg:p-8">
          {/* Node Flow Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pb-6 border-b border-[rgba(17,19,23,0.06)]">
            {ARCHITECTURE_PIPELINE.map((node, idx) => {
              const isActive = node.id === activeNode;
              const Icon = node.icon;
              return (
                <button
                  key={node.id}
                  onClick={() => setActiveNode(node.id)}
                  className={`flex flex-col items-start p-3.5 rounded-lg text-left transition-all cursor-pointer border ${
                    isActive
                      ? "bg-[#111317] border-[#111317] text-white shadow-sm"
                      : "bg-[#F8F9FA] border-[rgba(17,19,23,0.06)] text-[#4E5661] hover:bg-[#F1F2F4] hover:text-[#111317]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2.5">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center ${
                        isActive
                          ? "bg-[#315EF7] text-white"
                          : "bg-[rgba(17,19,23,0.06)] text-[#4E5661]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-mono opacity-50">
                      0{idx + 1}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-medium uppercase tracking-wider mb-0.5 ${isActive ? "text-[#315EF7]" : "text-[#7B838E]"}`}>
                    Layer 0{idx + 1}
                  </span>
                  <span className={`text-[14px] font-medium ${isActive ? "text-white" : "text-[#111317]"}`}>
                    {node.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Node Detail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-7 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-[rgba(49,94,247,0.08)] text-[#315EF7]">
                    {selectedNode.category}
                  </span>
                  <span className="text-[12px] font-mono text-[#7B838E]">
                    {selectedNode.specs}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#111317] tracking-tight">
                  {selectedNode.name} Architecture
                </h3>
                <p className="text-[14px] sm:text-[15px] text-[#4E5661] leading-relaxed">
                  {selectedNode.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedNode.tech.map((t, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-[#F8F9FA] border border-[rgba(17,19,23,0.06)] text-[12px] font-mono text-[#111317]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#F8F9FA] border border-[rgba(17,19,23,0.06)] rounded-lg p-5 font-mono text-[12px] text-[#4E5661] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[rgba(17,19,23,0.06)] pb-2">
                  <span className="text-[#111317] font-semibold text-[11px] tracking-wide">ARCHITECTURE SPEC</span>
                  <span className="text-[#169B62] flex items-center gap-1 font-medium text-[11px]">
                    VERIFIED
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B838E]">Pattern:</span>
                  <span className="text-[#111317] font-medium">Modular Architecture</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B838E]">Data Transport:</span>
                  <span className="text-[#111317] font-medium">HTTPS / TLS 1.3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B838E]">Environments:</span>
                  <span className="text-[#111317] font-medium">Staging + Production</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B838E]">Code Quality:</span>
                  <span className="text-[#315EF7] font-medium">Linted & Type-Safe</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 w-full px-6 sm:px-8 lg:px-16 relative z-10 bg-[#E8EAED] border-t border-[rgba(17,19,23,0.08)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-[1200px] mx-auto text-center"
        >
          <span className="section-label mb-3 block">
            Sprint Availability
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#111317] tracking-tight mb-4">
            Ready to start your project?
          </h2>
          <p className="text-[15px] sm:text-base text-[#4E5661] max-w-xl mx-auto mb-8 leading-relaxed">
            Configure your scope, calculate exact pricing transparently, and launch with our 50/50 milestone agreement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/pricing">
              <Button
                size="lg"
                className="rounded-[8px] h-11 px-6 text-[14px] font-medium bg-[#111317] text-white hover:bg-[#1C1F26] flex items-center gap-2"
              >
                Configure Project & Pricing <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="rounded-[8px] h-11 px-6 text-[14px] font-medium"
              >
                Get in Touch
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
    </PageReadinessGate>
  );
}
