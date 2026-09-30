"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on dashboard and auth routes
  const isDashboard = pathname?.startsWith("/dashboard");
  const isAuth =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";
  if (isDashboard || isAuth) return null;

  return (
    <footer className="mt-24 border-t border-[rgba(17,19,23,0.06)] bg-[#E8EAED] relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-16 py-16 lg:py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-6 lg:col-span-5">
            <Link href="/" className="text-xl font-semibold tracking-tight text-[#111317] flex items-center gap-2.5 mb-5">
              <div className="relative w-6 h-6 shrink-0">
                <img
                  src="/logo-v2.png"
                  alt="Runix Logo"
                  className="w-6 h-6 object-contain"
                />
              </div>
              Runix
            </Link>
            <p className="text-[#4B5563] max-w-sm text-[15px] leading-relaxed mb-6">
              We build digital products, platforms, and web applications that drive real business impact.
            </p>
            <a
              href="mailto:contact@runix.in"
              className="inline-flex items-center gap-1.5 text-base font-medium text-[#111317] hover:text-[#315EF7] transition-colors group"
            >
              contact@runix.in
              <ArrowUpRight className="w-4 h-4 text-[#4B5563] group-hover:text-[#315EF7] transition-colors" />
            </a>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-3" />

          {/* Links */}
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <h3 className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#6B7280] uppercase mb-5">
              Navigation
            </h3>
            <ul className="space-y-3 text-[14px]">
              <li><Link href="/work" className="text-[#4B5563] hover:text-[#111317] transition-colors font-medium">Work</Link></li>
              <li><Link href="/services" className="text-[#4B5563] hover:text-[#111317] transition-colors font-medium">Services</Link></li>
              <li><Link href="/pricing" className="text-[#4B5563] hover:text-[#111317] transition-colors font-medium">Pricing</Link></li>
              <li><Link href="/about" className="text-[#4B5563] hover:text-[#111317] transition-colors font-medium">About</Link></li>
              <li><Link href="/contact" className="text-[#4B5563] hover:text-[#111317] transition-colors font-medium">Contact</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <h3 className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#6B7280] uppercase mb-5">
              Connect
            </h3>
            <ul className="space-y-3 text-[14px]">
              <li>
                <a href="#" className="text-[#4B5563] hover:text-[#111317] transition-colors flex items-center justify-between group font-medium">
                  Twitter / X
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="#" className="text-[#4B5563] hover:text-[#111317] transition-colors flex items-center justify-between group font-medium">
                  LinkedIn
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="#" className="text-[#4B5563] hover:text-[#111317] transition-colors flex items-center justify-between group font-medium">
                  GitHub
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-[rgba(17,19,23,0.08)] flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-[#7B838E] font-mono">
          <p>© {new Date().getFullYear()} Runix Web Technologies. All rights reserved.</p>
          <div className="flex items-center space-x-5">
            <Link href="/privacy" className="hover:text-[#111317] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#111317] transition-colors">Terms of Service</Link>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-cookie-settings"));
                }
              }}
              className="hover:text-[#111317] transition-colors cursor-pointer"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
