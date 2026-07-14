"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, LogOut, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Hide navbar on dashboard routes (dashboard has its own layout)
  const isDashboard = pathname?.startsWith("/dashboard");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Work", path: "/work" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Hide navbar on dashboard routes (dashboard has its own layout)
  if (isDashboard) return null;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out flex justify-center pt-4 sm:pt-6 px-4`}
      >
        <div 
          className={`
            w-full max-w-7xl rounded-full flex items-center justify-between px-4 sm:px-6 py-3
            transition-all duration-500 ease-[0.16,1,0.3,1]
            ${isScrolled 
              ? "bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]" 
              : "bg-transparent border border-transparent"}
          `}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group relative z-10">
            <div className="relative w-12 h-12 group-hover:scale-105 transition-transform duration-300">
              <Image src="/logo-v2.png" alt="Runix Logo" fill className="object-contain" />
            </div>
            <span className="font-jakarta font-bold text-2xl tracking-tight text-white group-hover:text-zinc-300 transition-colors">
              Runix
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-2 py-1.5 absolute left-1/2 -translate-x-1/2 backdrop-blur-md">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  pathname === link.path
                    ? "text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {pathname === link.path && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-white rounded-full -z-10 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </Link>
            ))}
          </nav>

          {/* CTA / Auth */}
          <div className="hidden md:flex items-center gap-3 z-10">
            {!loading && user ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <button className="inline-flex items-center gap-2 bg-zinc-900 border border-white/10 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-zinc-800 transition-all duration-300">
                    <UserIcon className="w-4 h-4" />
                    Dashboard
                  </button>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 bg-transparent text-zinc-400 text-sm font-bold p-2.5 rounded-full hover:text-white hover:bg-white/5 transition-all duration-300"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : !loading ? (
              <Link href="/login">
                <button className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-[0.98] transition-all duration-300">
                  Login / Register
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : null}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2.5 text-white hover:bg-white/10 rounded-full transition-colors relative z-20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-[#050505]/95 backdrop-blur-3xl md:hidden pt-32 px-6 pb-8 flex flex-col"
          >
            <nav className="flex flex-col gap-6 text-3xl font-jakarta font-black tracking-tighter">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <Link
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-2 ${
                      pathname === link.path ? "text-white" : "text-zinc-500 hover:text-white transition-colors"
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div 
              className="mt-auto pb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {!loading && user ? (
                <div className="flex flex-col gap-4">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full inline-flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 text-white text-lg font-bold px-6 py-4 rounded-full shadow-lg hover:scale-[1.02] transition-all">
                      <UserIcon className="w-5 h-5" />
                      Dashboard
                    </button>
                  </Link>
                  <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="w-full text-zinc-400 font-bold py-3 hover:text-white transition-colors">
                    Sign Out
                  </button>
                </div>
              ) : !loading ? (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full inline-flex items-center justify-center gap-2 bg-white text-black text-lg font-bold px-6 py-4 rounded-full shadow-lg hover:scale-[1.02] transition-all">
                    Login / Register
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
