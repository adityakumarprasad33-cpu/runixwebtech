import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Privacy Policy | Runix Web Technologies",
  description: "Privacy policy and data governance practices for Runix Web Technologies.",
};

export default function PrivacyPage() {
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
          <span className="section-label mb-2 block">Legal & Privacy</span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111317] mb-3">
            Privacy Policy
          </h1>
          <p className="text-[14px] text-[#6B7280] font-mono">
            Last updated: September 2026 • Runix Web Technologies
          </p>
        </div>

        {/* Content */}
        <div className="premium-card p-8 sm:p-12 space-y-8 text-[15px] leading-relaxed text-[#4B5563]">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              1. Introduction
            </h2>
            <p>
              Runix Web Technologies (&ldquo;Runix&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) respects your privacy and is committed to protecting the personal information you share with us through our website (runix.in), client portals, and related software engineering services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              2. Information We Collect
            </h2>
            <p>
              We collect information that you provide directly to us when contacting us, requesting a technical proposal, creating an account, or contracting our development services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[14px]">
              <li><strong className="text-[#111317]">Contact Information:</strong> Name, work email address, company name, phone number, and billing details.</li>
              <li><strong className="text-[#111317]">Project Data:</strong> Technical briefs, wireframes, architectural specifications, and reference materials provided for project scoping.</li>
              <li><strong className="text-[#111317]">Authentication Data:</strong> User account credentials, email verification records, and activity timestamps in the client dashboard.</li>
              <li><strong className="text-[#111317]">System Telemetry:</strong> Anonymized usage data, browser type, operating system, and IP address for security monitoring and platform performance optimization.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              3. How We Use Your Information
            </h2>
            <p>
              We use collected information solely for legitimate business purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[14px]">
              <li>Delivering contracted software engineering and web development sprints.</li>
              <li>Maintaining client staging preview environments and dashboard workspaces.</li>
              <li>Generating verified invoices, milestone receipts, and payment processing confirmations.</li>
              <li>Responding to technical inquiries and providing continuous maintenance support.</li>
              <li>Protecting our infrastructure against fraud, abuse, and security vulnerabilities.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              4. Code & Intellectual Property Confidentiality
            </h2>
            <p>
              Runix adheres to strict non-disclosure standards. All proprietary code, database architectures, APIs, and client-supplied trade secrets remain strictly confidential and will never be shared, sold, or redistributed to third parties without prior written consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              5. Third-Party Service Providers
            </h2>
            <p>
              We partner with trusted enterprise cloud infrastructure providers to run our platforms:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[14px]">
              <li><strong className="text-[#111317]">Hosting & Edge Compute:</strong> Vercel and Cloudflare.</li>
              <li><strong className="text-[#111317]">Database & Auth:</strong> Google Cloud Platform / Firebase.</li>
              <li><strong className="text-[#111317]">Payment Processing:</strong> Verified Indian UPI and banking networks for milestone escrow.</li>
            </ul>
            <p className="text-[14px]">
              These third parties process data strictly in compliance with applicable security regulations and contractual privacy safeguards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              6. Your Data Rights
            </h2>
            <p>
              Under applicable data protection laws, you retain the right to request access to your personal data, request corrections, or request complete account deletion upon termination of active projects. Contact us at <a href="mailto:contact@runix.in" className="text-[#315EF7] hover:underline font-medium">contact@runix.in</a> to exercise these rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[#111317] tracking-tight">
              7. Contact Us
            </h2>
            <p>
              If you have any questions or concerns regarding our privacy practices, please contact our legal and compliance desk at:
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
