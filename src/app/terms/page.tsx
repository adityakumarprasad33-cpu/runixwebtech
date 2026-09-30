import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Terms of Service | Runix Web Technologies",
  description: "Terms and conditions of service for Runix Web Technologies.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col w-full items-center relative bg-[#F1F2F4] text-[#111317] overflow-x-clip min-h-screen">
      {/* Subtle dot grid */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-20" />

      <main className="relative z-10 w-full max-w-[800px] mx-auto px-6 sm:px-8 pt-32 pb-24">
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="rounded-[8px] text-[12px] font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12 border-b border-[rgba(17,19,23,0.08)] pb-8">
          <span className="section-label mb-2 block">Legal & Governance</span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111317] mb-3">
            Terms of Service
          </h1>
          <p className="text-[14px] text-[#6B7280] font-mono">
            Last updated: September 2026 • Runix Web Technologies
          </p>
        </div>

        {/* Content */}
        <div className="premium-card p-8 sm:p-12 space-y-8 text-[15px] leading-relaxed text-[#4B5563]">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing runix.in, engaging Runix Web Technologies for custom software engineering, website development, or accessing the Runix client dashboard, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should discontinue use of our services immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              2. Scope of Services & Sprints
            </h2>
            <p>
              Runix provides custom web application engineering, landing page creation, product design, and related cloud engineering services. Each engagement is defined by an agreed-upon technical scope, deliverables list, and estimated timeline established prior to sprint initiation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              3. Milestone Payment Model & Verification
            </h2>
            <p>
              Unless otherwise documented in a written service agreement, project engagements operate under our standard 50/50 milestone framework:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[14px]">
              <li><strong className="text-[#111317]">Sprint Commencement Advance (50%):</strong> Due prior to project onboarding, architecture planning, and environment configuration.</li>
              <li><strong className="text-[#111317]">Private Staging Preview:</strong> The complete functional build is deployed to a private staging URL for client inspection, testing, and feedback.</li>
              <li><strong className="text-[#111317]">Final Balance (50%):</strong> Due upon successful verification of deliverables on staging prior to final DNS migration, production release, or source code handover.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              4. Code Ownership & Intellectual Property
            </h2>
            <p>
              Upon complete settlement of all agreed project fees, the full intellectual property rights, source code, design assets, and deployment configurations produced specifically for the project transfer completely to the client. Runix retains ownership of its internal reusable utility libraries, developer tooling, and foundational component frameworks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              5. Client Responsibilities
            </h2>
            <p>
              Clients agree to provide timely feedback, necessary brand assets, and required third-party API credentials (e.g. domain DNS access, payment gateway keys) to ensure uninterrupted sprint progress. Unreasonable delays in feedback may adjust delivery schedules proportionally.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              6. Warranties & Post-Launch Support
            </h2>
            <p>
              Runix provides a complimentary 14-day warranty period following production deployment to resolve any regressions or deviations from the agreed specification. Continued maintenance, ongoing feature development, and infrastructure monitoring beyond this window are governed by dedicated support tiers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              7. Limitation of Liability
            </h2>
            <p>
              In no event shall Runix Web Technologies, its officers, or engineers be liable for any indirect, incidental, or consequential damages resulting from downtime of third-party cloud hosting providers, external API outages, or unauthorized third-party modifications made to delivered source code.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              8. Contact
            </h2>
            <p>
              For legal inquiries, contracts, or notices regarding these terms:
            </p>
            <div className="p-4 rounded-md bg-[#F8F9FA] border border-[rgba(17,19,23,0.06)] font-mono text-[13px] text-[#111317]">
              Runix Web Technologies<br />
              Email: contact@runix.in<br />
              Website: runix.in
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
