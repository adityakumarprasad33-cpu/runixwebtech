"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Percent,
  Calendar,
  Gift,
  ExternalLink,
  ShieldCheck,
  Flame,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  discountBadge?: string;
  promoCode?: string;
  actionLink?: string;
  buttonText?: string;
  startDate: string;
  endDate: string;
  targetType: "broadcast" | "user";
  targetUserId?: string | null;
  targetEmail?: string | null;
  isActive: boolean;
  createdAt: string;
}

function useCountdown(targetIso: string) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculate = () => {
      const difference = new Date(targetIso).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  return timeLeft;
}

function OfferCard({ offer }: { offer: Offer }) {
  const countdown = useCountdown(offer.endDate);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!offer.promoCode) return;
    navigator.clipboard.writeText(offer.promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedEndDate = new Date(offer.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-3xl bg-[#0e0e11] border border-white/10 hover:border-indigo-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
    >
      {/* Top Banner Image or Gradient Glow */}
      {offer.imageUrl ? (
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-black/60 border-b border-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={offer.imageUrl}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e11] via-transparent to-black/30" />
          
          {/* Discount Badge on Image */}
          {offer.discountBadge && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold tracking-wider shadow-lg">
              <Flame className="w-3.5 h-3.5 fill-white" />
              {offer.discountBadge}
            </div>
          )}

          {/* Individual Exclusive Badge */}
          {offer.targetType === "user" && (
            <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider shadow-lg border border-indigo-300/30">
              <Sparkles className="w-3 h-3" /> Exclusive For You
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-24 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-black p-4 flex items-center justify-between border-b border-white/5">
          {offer.discountBadge ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-extrabold tracking-wider shadow-lg">
              <Flame className="w-3.5 h-3.5 fill-white" />
              {offer.discountBadge}
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Tag className="w-5 h-5" />
            </div>
          )}

          {offer.targetType === "user" && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Personalized Deal
            </span>
          )}
        </div>
      )}

      {/* Main Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
        <div className="space-y-3">
          <h3 className="text-xl font-bold font-jakarta text-white group-hover:text-indigo-300 transition-colors leading-tight">
            {offer.title}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-3">
            {offer.description}
          </p>
        </div>

        {/* Promo Code & Expiration Timer Grid */}
        <div className="space-y-3 pt-2">
          {/* Promo Code Box */}
          {offer.promoCode && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
                  {offer.promoCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer"
                title="Copy Coupon Code"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Countdown Clock Box */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Expires:</span>
            </div>
            {countdown.isExpired ? (
              <span className="text-red-400 font-bold">Expired</span>
            ) : (
              <div className="flex items-center gap-1 font-mono font-bold text-amber-300">
                <span>{countdown.days}d</span>
                <span className="text-zinc-600">:</span>
                <span>{String(countdown.hours).padStart(2, "0")}h</span>
                <span className="text-zinc-600">:</span>
                <span>{String(countdown.minutes).padStart(2, "0")}m</span>
                <span className="text-zinc-600">:</span>
                <span>{String(countdown.seconds).padStart(2, "0")}s</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA Action Button */}
        <div className="pt-2">
          <Link href={offer.actionLink || "/dashboard"}>
            <Button
              variant="accent"
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-lg group-hover:shadow-indigo-500/20 transition-all"
            >
              <span>{offer.buttonText || "Claim Offer"}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardOffersPage() {
  const { user, isDeveloper } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDeveloper) {
      router.replace("/dashboard/developer");
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "offers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const allOffers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer));
        
        // Filter: active, within date window, and targeted to broadcast or this user
        const now = Date.now();
        const validOffers = allOffers.filter((o) => {
          if (!o.isActive) return false;
          
          // Date window check
          const start = new Date(o.startDate).getTime();
          const end = new Date(o.endDate).getTime();
          if (now < start || now > end) return false;

          // Audience check
          if (o.targetType === "broadcast") return true;
          if (o.targetType === "user") {
            return (
              o.targetUserId === user.uid ||
              (o.targetEmail && o.targetEmail.toLowerCase() === (user.email || "").toLowerCase())
            );
          }
          return false;
        });

        const uniqueOffers = Array.from(
          new Map(validOffers.map((o) => [o.id, o])).values()
        );

        setOffers(uniqueOffers);
        setLoading(false);
      },
      (err) => {
        console.error("Realtime offers error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black border border-white/10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Exclusive Platform Deals
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-jakarta text-white tracking-tight">
            Special Offers & Promotions
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Take advantage of limited-time discounts, customized tier perks, and seasonal specials tailored for your web development & scaling projects.
          </p>
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl bg-[#0c0c0e] border border-white/5 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Gift className="w-8 h-8 opacity-80" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Active Offers Right Now</h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
              You are currently on our best standard tier. Watch your notification bell for upcoming launch sales, client vouchers, and holiday promotions!
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="rounded-xl px-5 border-white/10 text-xs">
              Explore Dashboard
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
