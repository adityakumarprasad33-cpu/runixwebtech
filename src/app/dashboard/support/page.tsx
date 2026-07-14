"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { MessageSquare, Mail, ArrowRight, HelpCircle, Book, ExternalLink } from "lucide-react";

const faqs = [
  { q: "How long does a project take?", a: "Timelines depend on the plan. Essential plans take 5-7 days, Professional 2-3 weeks, and Enterprise projects are scoped individually." },
  { q: "Can I request revisions?", a: "Yes! All plans include revision rounds. Essential includes 2 rounds, Professional includes 5, and Enterprise has unlimited revisions." },
  { q: "What if I need to cancel?", a: "You can request cancellation before development begins for a full refund. Once development starts, partial refunds are handled case-by-case." },
  { q: "Do you offer ongoing maintenance?", a: "Yes. We offer monthly maintenance packages that include updates, bug fixes, and minor content changes." },
];

export default function SupportPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white font-jakarta tracking-tight">Support</h1>
        <p className="text-zinc-500 text-sm mt-1">Need help? Reach out to us or find answers below.</p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors group cursor-pointer"
          onClick={() => router.push("/contact")}
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Send an Inquiry</h3>
          <p className="text-sm text-zinc-500 mb-4">Submit your question or concern and we'll get back to you within 24 hours.</p>
          <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Go to Contact <ArrowRight className="w-3 h-3" />
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Email Us Directly</h3>
          <p className="text-sm text-zinc-500 mb-4">For urgent matters, email us and we'll prioritize your request.</p>
          <a href="mailto:support@runixweb.com" className="text-xs text-emerald-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            support@runixweb.com <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <Book className="w-4 h-4 text-zinc-500" />
          <h2 className="text-base font-bold text-white">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y divide-white/5">
          {faqs.map((faq, i) => (
            <button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full text-left p-5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span className="text-sm font-semibold text-white">{faq.q}</span>
                </div>
                <span className={`text-zinc-500 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
              </div>
              {openFaq === i && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-sm text-zinc-400 mt-3 ml-7 leading-relaxed"
                >
                  {faq.a}
                </motion.p>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
