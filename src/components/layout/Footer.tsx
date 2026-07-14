"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on dashboard routes
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <footer className="mt-24 border-t border-white/10 bg-[#050505] relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-6 lg:col-span-5">
            <Link href="/" className="font-jakarta text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 mb-8">
              <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black text-base">
                R
              </span>
              Runix
            </Link>
            <p className="text-zinc-400 max-w-sm text-lg leading-relaxed mb-10">
              We engineer premium digital experiences. Websites, products, and platforms that command attention and drive serious results.
            </p>
            <div className="flex flex-col gap-6">
              <a href="mailto:hello@runixtech.com" className="inline-flex items-center gap-2 text-xl font-medium text-white hover:text-zinc-300 transition-colors group w-fit">
                hello@runixtech.com
                <ArrowUpRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </a>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-3"></div>

          {/* Links Col */}
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <h3 className="font-semibold text-xs tracking-widest text-zinc-500 uppercase mb-8">Navigation</h3>
            <ul className="space-y-5 text-base font-medium">
              <li><Link href="/work" className="text-zinc-300 hover:text-white transition-colors">Work</Link></li>
              <li><Link href="/services" className="text-zinc-300 hover:text-white transition-colors">Services</Link></li>
              <li><Link href="/about" className="text-zinc-300 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-zinc-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Socials Col */}
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <h3 className="font-semibold text-xs tracking-widest text-zinc-500 uppercase mb-8">Socials</h3>
            <ul className="space-y-5 text-base font-medium">
              <li>
                <a href="#" className="text-zinc-300 hover:text-white transition-colors flex items-center justify-between group">
                  Twitter
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-300 hover:text-white transition-colors flex items-center justify-between group">
                  LinkedIn
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-300 hover:text-white transition-colors flex items-center justify-between group">
                  Dribbble
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-zinc-500 font-medium">
          <p>© {new Date().getFullYear()} Runix Web Technologies. All rights reserved.</p>
          <div className="flex space-x-8">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
      
      {/* Massive subtle watermark */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 text-[15vw] font-jakarta font-extrabold text-white/[0.02] pointer-events-none whitespace-nowrap tracking-tighter select-none">
        RUNIX
      </div>
    </footer>
  );
}
