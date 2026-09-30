"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
        <h1 className="text-2xl font-bold text-[#111317]  tracking-tight">Support Desk</h1>
        <p className="text-[#4B5563] text-sm mt-1">Need help with your sprint or deployment? Reach our engineering team or explore FAQs.</p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[rgba(21,24,29,0.10)] rounded-2xl p-6 hover:border-[rgba(21,24,29,0.16)] transition-all shadow-[0_12px_40px_rgba(21,24,29,0.04)] group cursor-pointer"
          onClick={() => router.push("/contact")}
        >
          <div className="w-11 h-11 rounded-xl bg-[#315EF7]/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5 text-[#315EF7]" />
          </div>
          <h3 className="text-base font-bold text-[#111317] mb-1">Send an Engineering Inquiry</h3>
          <p className="text-sm text-[#4B5563] mb-4">Submit your technical question or sprint adjustment and we'll reply within 24 hours.</p>
          <span className="text-xs text-[#315EF7] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Go to Contact Desk <ArrowRight className="w-3 h-3" />
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white border border-[rgba(21,24,29,0.10)] rounded-2xl p-6 hover:border-[rgba(21,24,29,0.16)] transition-all shadow-[0_12px_40px_rgba(21,24,29,0.04)]"
        >
          <div className="w-11 h-11 rounded-xl bg-[#169B62]/10 flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-[#169B62]" />
          </div>
          <h3 className="text-base font-bold text-[#111317] mb-1">Direct Engineering Mail</h3>
          <p className="text-sm text-[#4B5563] mb-4">For urgent build incidents or deployment escalations, email directly.</p>
          <a href="mailto:support@runixweb.com" className="text-xs text-[#169B62] font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            support@runixweb.com <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-white border border-[rgba(21,24,29,0.10)] rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(21,24,29,0.06)]">
        <div className="p-6 border-b border-[rgba(21,24,29,0.08)] bg-[#FAFAFA] flex items-center gap-3">
          <Book className="w-4 h-4 text-[#6B7280]" />
          <h2 className="text-base font-bold text-[#111317]">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y divide-[rgba(21,24,29,0.06)]">
          {faqs.map((faq, i) => (
            <button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full text-left p-5 hover:bg-[#F1F2F4]/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-[#6B7280] shrink-0" />
                  <span className="text-sm font-semibold text-[#111317]">{faq.q}</span>
                </div>
                <span className={`text-[#6B7280] transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
              </div>
              {openFaq === i && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-sm text-[#4B5563] mt-3 ml-7 leading-relaxed"
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
