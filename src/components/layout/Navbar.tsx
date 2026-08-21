"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ArrowRight, LogOut, User as UserIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const scrollTicking = useRef(false);

  // Hide navbar on dashboard and auth routes
  const isDashboard = pathname?.startsWith("/dashboard");
  const isAuth = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      if (!scrollTicking.current) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 60;
          setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
          scrollTicking.current = false;
        });
        scrollTicking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change or Escape key
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    { name: "Work", path: "/work" },
    { name: "Services", path: "/services" },
    { name: "Pricing", path: "/pricing" },
    { name: "Offers", path: "/offers" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    router.push("/");
  };

  // Hide navbar on dashboard and auth routes
  if (isDashboard || isAuth) return null;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 sm:pt-5 px-4 pointer-events-none transition-all duration-500`}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className={`
            w-full rounded-full flex items-center justify-between pointer-events-auto
            transition-all duration-500 ease-[0.16,1,0.3,1]
            ${
              isScrolled
                ? "max-w-2xl px-3.5 sm:px-5 py-2.5 bg-black/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]"
                : "max-w-7xl px-4 sm:px-6 py-3 bg-black/30 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]"
            }
          `}
        >
          {/* Logo (Always Left) */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group relative z-10 shrink-0">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/logo-v2.png"
                alt="Runix Logo"
                fill
                priority
                sizes="44px"
                className="object-contain"
              />
            </div>
            <span className="font-jakarta font-bold text-xl sm:text-2xl tracking-tight text-white group-hover:text-zinc-300 transition-colors">
              Runix
            </span>
          </Link>

          {/* Desktop Center Navigation (Visible only when NOT scrolled down) */}
          <AnimatePresence>
            {!isScrolled && (
              <motion.nav
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="hidden md:flex items-center bg-white/[0.03] border border-white/10 rounded-full px-2 py-1.5 backdrop-blur-xl"
              >
                {navLinks.map((link) => {
                  const isActive = pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      href={link.path}
                      className={`relative px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                        isActive ? "text-black" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNavBackground"
                          className="absolute inset-0 bg-white rounded-full -z-10 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{link.name}</span>
                    </Link>
                  );
                })}
              </motion.nav>
            )}
          </AnimatePresence>

          {/* Right Action / CTA & Compact Menu Controls */}
          <div className="flex items-center gap-2 sm:gap-3 z-10">
            {/* When NOT scrolled: Full Desktop CTA Buttons */}
            {!isScrolled && (
              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-2">
                    <Link href="/dashboard">
                      <button className="inline-flex items-center gap-2 bg-zinc-900/80 border border-white/15 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-zinc-800 transition-all duration-300 cursor-pointer backdrop-blur-md shadow-sm">
                        <UserIcon className="w-4 h-4" />
                        Dashboard
                      </button>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-2 bg-transparent text-zinc-400 text-sm font-bold p-2 rounded-full hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Link href="/login">
                    <button className="inline-flex items-center gap-2 bg-white text-black text-xs sm:text-sm font-bold px-5 sm:px-6 py-2 sm:py-2.5 rounded-full hover:scale-105 active:scale-[0.98] transition-all duration-300 cursor-pointer shadow-md">
                      Login / Register
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                )}
              </div>
            )}

            {/* When Scrolled (Desktop Compact State) OR Mobile: Menu Toggle Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`
                flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer
                ${
                  isScrolled
                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl shadow-sm"
                    : "md:hidden p-2.5 text-white hover:bg-white/10 rounded-full"
                }
              `}
              aria-label={menuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
            >
              {menuOpen ? (
                <>
                  <X className="w-4 h-4" />
                  {isScrolled && <span className="hidden sm:inline">Close</span>}
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4" />
                  {isScrolled && <span>Menu</span>}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </header>

      {/* ── Global Full Navigation Flyout / Drawer Overlay ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
              onClick={() => setMenuOpen(false)}
            />

            {/* Modal / Flyout Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-20 sm:top-24 left-4 right-4 max-w-lg mx-auto z-50 bg-[#0a0a0a]/75 backdrop-blur-3xl backdrop-saturate-150 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden"
            >
              {/* Header inside flyout */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8">
                    <Image src="/logo-v2.png" alt="Runix" fill className="object-contain" />
                  </div>
                  <span className="font-jakarta font-bold text-lg text-white">Runix Navigation</span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="py-6 flex flex-col gap-2">
                {navLinks.map((link, idx) => {
                  const isActive = pathname === link.path;
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        href={link.path}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl text-base font-semibold transition-all ${
                          isActive
                            ? "bg-white/10 text-white border border-white/15"
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>{link.name}</span>
                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-zinc-600" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Auth / Dashboard CTA Actions */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                {!loading && user ? (
                  <div className="flex flex-col gap-2">
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                      <button className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:opacity-95 transition-all cursor-pointer">
                        <UserIcon className="w-4 h-4" />
                        Go to Dashboard
                      </button>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-center text-xs font-semibold text-zinc-400 hover:text-red-400 py-2 transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : !loading ? (
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <button className="w-full inline-flex items-center justify-center gap-2 bg-white text-black text-sm font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:bg-zinc-200 transition-all cursor-pointer">
                      Login / Register
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
