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
    <div className="flex flex-col w-full items-center relative bg-[#F1F2F4] text-[#111317] overflow-hidden min-h-screen">
      {/* ── Hero Section ── */}
      <section className="relative w-full pt-32 md:pt-36 pb-12 px-4 z-10 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] text-[#4B5563] text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
            <Tag className="w-3.5 h-3.5 text-[#315EF7]" /> Active Promotional Vouchers
          </div>

          <h1 className=" text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#111317] tracking-tight leading-[0.95]">
            Engineering Sprint <br />
            <span className="text-[#315EF7]">
              Offers & Vouchers
            </span>
          </h1>

          <p className="text-base sm:text-xl text-[#4B5563] max-w-2xl mx-auto font-normal leading-relaxed">
            Discover verified seasonal vouchers, package discounts, and promo codes for your next web development sprint.
          </p>
        </motion.div>
      </section>

      {/* ── Active Offers Grid ── */}
      <section className="py-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 pb-28">
        {loading ? (
          <div className="text-center py-20 text-xs text-[#6B7280] font-mono">
            Loading active promotional campaigns...
          </div>
        ) : offers.length === 0 && coupons.length === 0 ? (
          <div className="p-12 rounded-xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] text-center max-w-xl mx-auto space-y-4 shadow-[0_12px_40px_rgba(21,24,29,0.06)]">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F2F4] text-[#4B5563] flex items-center justify-center mx-auto">
              <Tag className="w-6 h-6 text-[#315EF7]" />
            </div>
            <h3 className="text-lg font-bold  text-[#111317]">No Active Campaigns at the Moment</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Check back soon for upcoming seasonal promotions or browse our standard milestone packages.
            </p>
            <Link href="/pricing">
              <Button size="sm" className="rounded-[13px] bg-[#111317] text-white hover:bg-[#000000] text-xs font-semibold">
                View Pricing Packages <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 1. Promotional Campaigns */}
            {offers.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                  <Sparkles className="w-4 h-4 text-[#315EF7]" />
                  <h2 className="text-xs font-mono font-bold text-[#111317] uppercase tracking-wider">
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
                      className="rounded-xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] overflow-hidden flex flex-col justify-between shadow-[0_12px_40px_rgba(21,24,29,0.06)] hover:border-[rgba(21,24,29,0.20)] transition-all group"
                    >
                      <div>
                        {offer.imageUrl && (
                          <div className="w-full h-44 relative bg-[#E5E7EB] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={offer.imageUrl}
                              alt={offer.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {offer.discountBadge && (
                              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#111317] text-white font-mono font-bold text-xs shadow-sm">
                                {offer.discountBadge}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-6 space-y-3">
                          {!offer.imageUrl && offer.discountBadge && (
                            <span className="inline-block px-3 py-1 rounded-full bg-[#169B62]/10 border border-[#169B62]/20 text-[#169B62] font-mono font-bold text-xs">
                              {offer.discountBadge}
                            </span>
                          )}

                          <h3 className="text-lg font-bold  text-[#111317] leading-snug">{offer.title}</h3>
                          <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-3">
                            {offer.description}
                          </p>

                          <div className="pt-2 flex items-center justify-between text-[11px] text-[#6B7280] border-t border-[rgba(21,24,29,0.06)] font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Valid Until:
                            </span>
                            <span className="text-[#111317] font-medium">
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
                          <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[rgba(21,24,29,0.08)] flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-[#111317]">
                              {offer.promoCode}
                            </span>
                            <button
                              onClick={() => handleCopyCode(offer.promoCode)}
                              className="p-1 rounded-md text-[#6B7280] hover:text-[#111317] transition-colors cursor-pointer"
                              title="Copy code"
                            >
                              {copiedCode === offer.promoCode ? (
                                <Check className="w-3.5 h-3.5 text-[#169B62]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}

                        <Link
                          href={
                            offer.promoCode
                              ? `/pricing?coupon=${encodeURIComponent(offer.promoCode)}`
                              : offer.actionLink || "/pricing"
                          }
                          className="block"
                        >
                          <Button size="sm" className="w-full rounded-[13px] bg-[#315EF7] hover:bg-[#2A50D4] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm">
                            <span>{offer.buttonText || "Claim Deal"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
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
                  <Percent className="w-4 h-4 text-[#169B62]" />
                  <h2 className="text-xs font-mono font-bold text-[#111317] uppercase tracking-wider">
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
                      className="p-6 rounded-xl bg-[#FFFFFF] border border-[rgba(21,24,29,0.10)] flex flex-col justify-between space-y-4 shadow-[0_12px_40px_rgba(21,24,29,0.06)] hover:border-[rgba(21,24,29,0.20)] transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-3 py-1.5 rounded-xl bg-[#169B62]/10 text-[#169B62] font-mono font-extrabold text-sm tracking-wider border border-[#169B62]/20">
                            {coupon.code}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#F1F2F4] text-[#4B5563] border border-[rgba(21,24,29,0.08)]">
                            {coupon.scope || "universal"}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-[#111317] ">
                          {coupon.type === "percentage" ? (
                            <>
                              {coupon.value}% OFF
                              {coupon.maxDiscount > 0 && (
                                <span className="text-xs text-[#4B5563] font-normal ml-1">
                                  (up to ₹{coupon.maxDiscount.toLocaleString()})
                                </span>
                              )}
                            </>
                          ) : (
                            <>₹{coupon.value.toLocaleString()} Flat Discount</>
                          )}
                        </h3>

                        {coupon.bannerText && (
                          <p className="text-xs text-[#4B5563] leading-relaxed">{coupon.bannerText}</p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="p-2 rounded-xl bg-[#FAFAFA] border border-[rgba(21,24,29,0.06)]">
                            <span className="text-[#6B7280] block text-[10px] font-mono">Applies To:</span>
                            <span className="text-[#111317] font-medium truncate block">
                              {coupon.scope === "maintenance"
                                ? "Maintenance SLA"
                                : coupon.scope === "addons"
                                ? "Add-ons & Boosters"
                                : coupon.scope === "plans"
                                ? "Package Plans"
                                : "All Services"}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-[#FAFAFA] border border-[rgba(21,24,29,0.06)]">
                            <span className="text-[#6B7280] block text-[10px] font-mono">Valid Until:</span>
                            <span className="text-[#111317] font-medium font-mono">
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
                          className="flex-1 rounded-[13px] text-xs font-semibold flex items-center justify-center gap-1.5 border-[rgba(21,24,29,0.12)] text-[#111317]"
                        >
                          {copiedCode === coupon.code ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#169B62]" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Code
                            </>
                          )}
                        </Button>
                        <Link href={`/pricing?coupon=${encodeURIComponent(coupon.code)}`} className="flex-1">
                          <Button size="sm" className="w-full rounded-[13px] text-xs font-semibold bg-[#111317] text-white hover:bg-[#000000]">
                            Apply Code
                          </Button>
                        </Link>
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
