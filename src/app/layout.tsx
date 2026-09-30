import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import FloatingChatBot from "@/components/chat/FloatingChatBot";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export const viewport: Viewport = {
  themeColor: "#F1F2F4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Runix — We build digital products that people actually use",
  description: "Runix is a software engineering studio that designs and builds premium web applications, platforms, and digital products for startups, businesses, and institutions.",
};

import CookieConsent from "@/components/common/CookieConsent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Preload critical Homepage Slide 1 image: responsive AVIF for mobile (<768px) and desktop (>=768px) */}
        <link
          rel="preload"
          as="image"
          type="image/avif"
          href="/images/heroes/home/home-01-mobile.avif"
          media="(max-width: 767px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          type="image/avif"
          href="/images/heroes/home/home-01.avif"
          media="(min-width: 768px)"
          fetchPriority="high"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-[#F1F2F4] text-[#111317] antialiased min-h-screen flex flex-col selection:bg-[#315EF7]/20 selection:text-[#111317]`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col w-full">
            {children}
          </main>
          <Footer />
          <FloatingChatBot />
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
