"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
  Tag,
  Percent,
  Sparkles,
  Clock,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Gift,
  Layers,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";

export default function PublicOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffersAndCoupons = async () => {
      try {
        const now = Date.now();

        // 1. Fetch active broadcast offers
        const offersSnap = await getDocs(collection(db, "offers"));
        const activeOffers = offersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((o) => {
            if (!o.isActive) return false;
            if (o.targetType && o.targetType !== "broadcast") return false;
            const start = new Date(o.startDate).getTime();
            const end = new Date(o.endDate).getTime();
            return now >= start && now <= end;
          });

        // 2. Fetch active public coupons
        const couponsSnap = await getDocs(collection(db, "coupons"));
        const activeCoupons = couponsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((c) => {
            if (!c.isActive) return false;
            const start = new Date(c.startDate).getTime();
            const end = new Date(c.endDate).getTime();
            if (now < start || now > end) return false;
            if (c.usageLimit > 0 && (c.usedCount || 0) >= c.usageLimit) return false;
            return true;
          });

        setOffers(activeOffers);
        setCoupons(activeCoupons);
      } catch (err) {
        console.warn("Public offers fetch notice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffersAndCoupons();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="flex flex-col w-full items-center relative bg-[#050505] overflow-hidden min-h-screen">
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-10" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[60vh] bg-indigo-500/10 blur-[160px] pointer-events-none rounded-full" />

      {/* ── Hero Section ── */}
      <section className="relative w-full pt-32 md:pt-36 pb-12 px-4 z-10 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest">
            <Tag className="w-3.5 h-3.5 text-indigo-400" /> Exclusive Platform Deals
          </div>

          <h1 className="font-jakarta text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-[0.9]">
            Promotional <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Offers & Deals
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
            Discover active seasonal vouchers, bundle discounts, and promo codes for your next web development sprint.
          </p>
        </motion.div>
      </section>

      {/* ── Active Offers Grid ── */}
      <section className="py-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 pb-28">
        {loading ? (
          <div className="text-center py-20 text-xs text-zinc-500">
            Loading active promotional campaigns...
          </div>
        ) : offers.length === 0 && coupons.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-zinc-400 flex items-center justify-center mx-auto">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No Active Campaigns at the Moment</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Check back soon for upcoming seasonal promotions or browse our standard milestone packages.
            </p>
            <Button variant="accent" size="sm" asChild className="rounded-xl">
              <Link href="/pricing" className="flex items-center gap-1.5">
                View Pricing Packages <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 1. Promotional Campaigns */}
            {offers.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs">
                    Featured Campaigns & Deals
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {offers.map((offer, idx) => (
                    <motion.div
                      key={offer.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-3xl bg-zinc-900/40 border border-white/10 overflow-hidden flex flex-col justify-between backdrop-blur-xl hover:border-indigo-500/30 transition-all group"
                    >
                      <div>
                        {offer.imageUrl && (
                          <div className="w-full h-44 relative bg-black overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={offer.imageUrl}
                              alt={offer.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {offer.discountBadge && (
                              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-white font-mono font-bold text-xs shadow-lg">
                                {offer.discountBadge}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-6 space-y-3">
                          {!offer.imageUrl && offer.discountBadge && (
                            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-bold text-xs">
                              {offer.discountBadge}
                            </span>
                          )}

                          <h3 className="text-lg font-bold text-white leading-snug">{offer.title}</h3>
                          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                            {offer.description}
                          </p>

                          <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-500 border-t border-white/5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Valid Until:
                            </span>
                            <span className="text-zinc-300 font-medium font-mono">
                              {new Date(offer.endDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 pt-0 space-y-3">
                        {offer.promoCode && (
                          <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-indigo-300">
                              {offer.promoCode}
                            </span>
                            <button
                              onClick={() => handleCopyCode(offer.promoCode)}
                              className="p-1 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Copy code"
                            >
                              {copiedCode === offer.promoCode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}

                        <Button variant="accent" size="sm" asChild className="w-full rounded-xl">
                          <Link
                            href={
                              offer.promoCode
                                ? `/pricing?coupon=${encodeURIComponent(offer.promoCode)}`
                                : offer.actionLink || "/pricing"
                            }
                            className="flex items-center justify-center gap-1.5 font-bold"
                          >
                            <span>{offer.buttonText || "Claim Deal"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Active Promo Vouchers */}
            {coupons.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs">
                    Active Promo Codes & Vouchers
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coupons.map((coupon, idx) => (
                    <motion.div
                      key={coupon.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-6 rounded-3xl bg-zinc-900/40 border border-white/10 flex flex-col justify-between space-y-4 backdrop-blur-xl hover:border-emerald-500/30 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-extrabold text-sm tracking-wider border border-emerald-500/30">
                            {coupon.code}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                            {coupon.scope || "universal"}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white">
                          {coupon.type === "percentage" ? (
                            <>
                              {coupon.value}% OFF
                              {coupon.maxDiscount > 0 && (
                                <span className="text-xs text-zinc-400 font-normal ml-1">
                                  (up to ₹{coupon.maxDiscount.toLocaleString()})
                                </span>
                              )}
                            </>
                          ) : (
                            <>₹{coupon.value.toLocaleString()} Flat Discount</>
                          )}
                        </h3>

                        {coupon.bannerText && (
                          <p className="text-xs text-zinc-400 leading-relaxed">{coupon.bannerText}</p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-zinc-500 block text-[10px]">Applies To:</span>
                            <span className="text-zinc-300 font-medium truncate block">
                              {coupon.scope === "maintenance"
                                ? "Maintenance SLA"
                                : coupon.scope === "addons"
                                ? "Add-ons & Boosters"
                                : coupon.scope === "plans"
                                ? "Package Plans"
                                : "All Services"}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-zinc-500 block text-[10px]">Valid Until:</span>
                            <span className="text-zinc-300 font-medium">
                              {new Date(coupon.endDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => handleCopyCode(coupon.code)}
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          {copiedCode === coupon.code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Code
                            </>
                          )}
                        </Button>
                        <Button variant="accent" size="sm" asChild className="flex-1 rounded-xl text-xs font-bold">
                          <Link href={`/pricing?coupon=${encodeURIComponent(coupon.code)}`}>
                            Apply Code
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
