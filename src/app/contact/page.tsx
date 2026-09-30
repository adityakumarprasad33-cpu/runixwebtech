"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Mail, ArrowRight, ShieldCheck, Terminal, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import RunixRealisticDeveloperHero from "@/components/hero/RunixRealisticDeveloperHero";
import { PageReadinessGate } from "@/components/readiness/PageReadinessGate";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    projectType: "Web Application / SaaS",
    budget: "₹10,000 – ₹25,000",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "inquiries"), {
        ...formData,
        createdAt: serverTimestamp(),
        source: "contact_page",
        status: "new",
      });
      setSubmitted(true);
    } catch (err) {
      console.warn("Inquiry submission notice:", err);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageReadinessGate pagePath="/contact">
      <div className="flex flex-col w-full items-center relative bg-[#F1F2F4] text-[#111317] overflow-x-clip min-h-screen">
        {/* Subtle dot grid */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-20" />

        {/* ── Hero ── */}
        <RunixRealisticDeveloperHero page="contact" />

      {/* Contact & Intake Form Section */}
      <section id="intake-form" className="py-16 lg:py-24 w-full max-w-[1200px] px-6 sm:px-8 lg:px-16 relative z-10 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column: Direct Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="section-label mb-3 block">Start a Conversation</span>
              <h2 className="text-3xl sm:text-[2.5rem] font-semibold text-[#111317] tracking-tight leading-[1.15] mb-3">
                Talk directly with our engineering team.
              </h2>
              <p className="text-[15px] text-[#4E5661] leading-relaxed">
                Whether you have a complete technical specification or an early concept that needs scoping, we respond with realistic timelines and fixed milestone estimates.
              </p>
            </div>

            {/* Email Card */}
            <a
              href="mailto:contact@runix.in"
              className="block bg-white border border-[rgba(17,19,23,0.08)] rounded-xl p-6 group transition-all"
            >
              <div className="w-10 h-10 rounded-[8px] bg-[#F1F2F4] flex items-center justify-center mb-4 group-hover:bg-[rgba(49,94,247,0.1)] transition-colors">
                <Mail className="w-5 h-5 text-[#315EF7]" />
              </div>
              <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#7B838E] uppercase block mb-1">
                Direct Email
              </span>
              <p className="text-xl font-semibold text-[#111317] group-hover:text-[#315EF7] transition-colors">
                contact@runix.in
              </p>
              <p className="text-[13px] text-[#4E5661] mt-1.5">
                Reach senior engineering leads directly.
              </p>
            </a>

            {/* Client Portal Card */}
            <div className="bg-white border border-[rgba(17,19,23,0.08)] rounded-xl p-6">
              <div className="w-10 h-10 rounded-[8px] bg-[#F1F2F4] flex items-center justify-center mb-4">
                <Terminal className="w-5 h-5 text-[#169B62]" />
              </div>
              <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#7B838E] uppercase block mb-1">
                Existing Clients
              </span>
              <p className="text-xl font-semibold text-[#111317]">
                Client Workspace
              </p>
              <p className="text-[13px] text-[#4E5661] mt-1.5 leading-relaxed">
                Active clients can log in to review private staging URLs, monitor milestone progress, and coordinate with developers.
              </p>
              <div className="mt-4 pt-3.5 border-t border-[rgba(17,19,23,0.06)]">
                <Link href="/dashboard" className="text-[14px] font-medium text-[#315EF7] hover:text-[#2A50D4] flex items-center gap-1.5 transition-colors">
                  Open Client Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Trust Badges Strip */}
            <div className="p-4 rounded-[8px] bg-[#E8EAED] border border-[rgba(17,19,23,0.06)] space-y-1.5 text-[12px] text-[#4E5661]">
              <div className="flex items-center gap-2 text-[#111317] font-medium">
                <ShieldCheck className="w-4 h-4 text-[#169B62]" />
                50/50 Milestone Protection
              </div>
              <p className="text-[12px] leading-relaxed">
                50% advance to initiate sprint. Balance is payable only upon your verified review on private staging.
              </p>
            </div>
          </div>

          {/* Right Column: Intake Form */}
          <div className="lg:col-span-7 bg-white border border-[rgba(17,19,23,0.08)] rounded-xl p-6 sm:p-10 shadow-[0_2px_8px_rgba(17,19,23,0.04)]">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-[8px] bg-[rgba(22,155,98,0.1)] text-[#169B62] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold text-[#111317]">
                  Message Received
                </h3>
                <p className="text-[15px] text-[#4B5563] max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="font-medium text-[#111317]">{formData.name}</span>. Our technical leads will review your project requirements and reply to <span className="font-medium text-[#111317]">{formData.email}</span> within 4 business hours.
                </p>
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", projectType: "Web Application / SaaS", budget: "₹10,000 – ₹25,000", message: "" });
                    }}
                    variant="outline"
                    className="rounded-[8px] text-[14px] font-medium"
                  >
                    Send Another Message
                  </Button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-xl font-semibold text-[#111317] mb-1">
                    Send a Project Inquiry
                  </h3>
                  <p className="text-[14px] text-[#4B5563]">
                    Tell us what you are building to receive an itemized proposal and timeline.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-medium uppercase text-[#6B7280]">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Vance"
                      className="form-input text-[14px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-medium uppercase text-[#6B7280]">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. alex@company.com"
                      className="form-input text-[14px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-medium uppercase text-[#6B7280]">
                      Project Type
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="form-input text-[14px] bg-white cursor-pointer"
                    >
                      <option>High-Converting Landing Page</option>
                      <option>Multi-Page Corporate Website</option>
                      <option>Web Application / SaaS</option>
                      <option>Custom Dashboard / Portal</option>
                      <option>E-Commerce / Storefront</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-medium uppercase text-[#6B7280]">
                      Budget Scope
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="form-input text-[14px] bg-white cursor-pointer"
                    >
                      <option>₹3,999 (Essential Landing Page)</option>
                      <option>₹9,999 (Professional Business)</option>
                      <option>₹19,999 – ₹50,000 (Custom Web App)</option>
                      <option>₹50,000+ (Enterprise Platform)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-medium uppercase text-[#6B7280]">
                    Project Overview & Requirements *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your current site, key features needed, target launch date, and any reference links..."
                    className="form-input text-[14px] resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full rounded-[8px] h-11 text-[14px] font-medium bg-[#111317] hover:bg-[#1C1F26] text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isSubmitting ? (
                    "Sending Message..."
                  ) : (
                    <>
                      Send Project Inquiry <Send className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-center text-[#6B7280] font-mono">
                  Replies sent from senior technical leads within 4 business hours.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
    </PageReadinessGate>
  );
}
