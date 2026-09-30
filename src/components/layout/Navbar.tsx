"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { prefetchRouteHero } from "@/lib/readiness/page-readiness";

interface AnnouncementConfig {
  text: string;
  href: string;
  enabled: boolean;
}

// Quiet, editorial announcement bar — appears only when genuinely useful
const ANNOUNCEMENT: AnnouncementConfig = {
  enabled: true,
  text: "New project intake is open",
  href: "/pricing",
};

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Hide navbar on dashboard and auth routes
  const isDashboard = pathname?.startsWith("/dashboard");
  const isAuth =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    router.push("/");
  };

  if (isDashboard || isAuth) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-200">
      {/* ── Subtle Editorial Announcement Strip ── */}
      {ANNOUNCEMENT.enabled && (
        <div className="w-full bg-[#E5E7EB] border-b border-[rgba(17,19,23,0.06)] h-[32px] sm:h-[34px] flex items-center justify-center px-4">
          <Link
            href={ANNOUNCEMENT.href}
            className="text-[12.5px] sm:text-[13px] text-[#4E5661] hover:text-[#111317] transition-colors inline-flex items-center gap-1.5 font-normal tracking-tight"
          >
            <span>{ANNOUNCEMENT.text}</span>
            <span aria-hidden="true" className="text-[#6B7280]">&rarr;</span>
          </Link>
        </div>
      )}

      {/* ── Main Flat Rectangular Navbar ── */}
      <div
        className={`
          w-full h-[64px] sm:h-[70px] lg:h-[74px] border-b transition-all duration-200
          ${
            isScrolled
              ? "bg-[#F1F2F4]/95 backdrop-blur-md border-[rgba(17,19,23,0.10)] shadow-[0_1px_2px_rgba(17,19,23,0.03)]"
              : "bg-[#F1F2F4] border-[rgba(17,19,23,0.08)]"
          }
        `}
      >
        <div className="max-w-[1200px] mx-auto h-full px-6 sm:px-8 lg:px-12 flex items-center justify-between">
          
          {/* LEFT: Runix logo + wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="Runix Home"
          >
            <div className="relative w-7 h-7 shrink-0">
              <Image
                src="/logo-v2.png"
                alt="Runix Logo"
                fill
                priority
                sizes="28px"
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-[19px] tracking-tight text-[#111317]">
              Runix
            </span>
          </Link>

          {/* CENTER: Navigation Links with subtle architectural underline */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onMouseEnter={() => prefetchRouteHero(link.path)}
                  className={`text-[14px] lg:text-[15px] py-1 transition-colors duration-150 tracking-normal relative ${
                    isActive
                      ? "text-[#111317] font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#111317]"
                      : "text-[#4E5661] font-normal hover:text-[#111317]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Client Login + Start a Project */}
          <div className="hidden md:flex items-center gap-5">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard"
                      className="text-[14px] font-medium text-[#4E5661] hover:text-[#111317] transition-colors flex items-center gap-1.5"
                    >
                      <UserIcon className="w-4 h-4 text-[#6B7280]" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="p-1.5 text-[#6B7280] hover:text-[#D83A3A] transition-colors cursor-pointer"
                      title="Sign out"
                      aria-label="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="text-[14px] font-medium text-[#4E5661] hover:text-[#111317] transition-colors"
                  >
                    Client Login
                  </Link>
                )}
              </>
            )}

            {/* Primary CTA: Rectangular, max 8px radius */}
            <Link href="/pricing">
              <button className="h-[40px] px-5 rounded-[8px] bg-[#111317] hover:bg-[#1C1F26] text-white text-[14px] font-medium inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer">
                Start a Project
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          {/* MOBILE: Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <Link href="/pricing">
              <button className="h-[34px] px-3.5 rounded-[8px] bg-[#111317] text-white text-[13px] font-medium inline-flex items-center gap-1.5">
                Start a Project
              </button>
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-[#111317] hover:bg-[rgba(17,19,23,0.05)] rounded-md transition-colors cursor-pointer"
              aria-label={menuOpen ? "Close Menu" : "Open Menu"}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* ── MOBILE FULL-WIDTH PANEL ── */}
      {menuOpen && (
        <div className="md:hidden w-full bg-[#F1F2F4] border-b border-[rgba(17,19,23,0.10)] px-6 py-6 space-y-4 shadow-lg">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`text-[15px] py-1.5 transition-colors ${
                    isActive
                      ? "text-[#111317] font-semibold"
                      : "text-[#4B5563] hover:text-[#111317]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[rgba(17,19,23,0.08)] flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="text-[14px] font-medium text-[#111317]"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-[14px] text-[#6B7280] hover:text-[#D83A3A]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-[14px] font-medium text-[#4E5661] hover:text-[#111317]"
              >
                Client Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
