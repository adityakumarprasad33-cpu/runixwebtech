"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  Code,
  Globe,
  Plus,
  X,
  CreditCard,
  CheckCircle2,
  FileText,
  Lock,
  Tag,
  Percent,
  Copy,
  Gift,
  AlertCircle,
  FolderKanban,
  Wrench,
  IndianRupee,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import Link from "next/link";

interface PlanTier {
  id: string;
  name: string;
  badge?: string;
  popular?: boolean;
  totalPrice: number;
  advancePrice: number;
  finalPrice: number;
  delivery: string;
  description: string;
  features: string[];
}

interface Addon {
  id: string;
  title: string;
  price: number;
  description: string;
}

interface AppliedCoupon {
  id: string;
  code: string;
  type: "percentage" | "flat";
  value: number;
  maxDiscount?: number;
  minOrderValue?: number;
  scope?: "all" | "plans" | "addons" | "maintenance";
  applicablePlans?: string[];
  applicableAddons?: string[];
}

const PLANS: PlanTier[] = [
  {
    id: "essential",
    name: "Essential",
    badge: "Fast Launch",
    totalPrice: 3999,
    advancePrice: 1999,
    finalPrice: 2000,
    delivery: "3–5 Days Delivery",
    description: "Perfect for high-converting landing pages, product waitlists, or creator portfolios.",
    features: [
      "1–3 Custom Designed Sections",
      "Mobile-First Responsive Layout",
      "Modern Micro-Animations",
      "Contact / Lead Capture Form",
      "Fast CDN Cloud Deployment",
      "Free 30-Day Support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    badge: "Most Popular",
    popular: true,
    totalPrice: 9999,
    advancePrice: 4999,
    finalPrice: 5000,
    delivery: "7–10 Days Delivery",
    description: "Complete multi-page business website designed to establish brand authority and convert visitors.",
    features: [
      "Up to 8 Custom Responsive Pages",
      "Tailored 3D/Interactive Motion UI",
      "SEO & OpenGraph Optimization",
      "Lead Capture & Notification System",
      "Live Staging Demo Preview",
      "Google Analytics & Speed Tuning",
      "Priority Developer Room Chat",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise MVP",
    badge: "Full Web App",
    totalPrice: 24999,
    advancePrice: 12499,
    finalPrice: 12500,
    delivery: "14–21 Days Delivery",
    description: "Full-scale Web App, SaaS MVP, or Admin Dashboard with role-based auth and database workflows.",
    features: [
      "Full Web App / MVP Platform",
      "Authentication & Role-Based Access",
      "Admin Dashboard & Data Visualizations",
      "Real-time Firestore Database Engine",
      "Payment Gateway Integration",
      "Full GitHub Repository & Code Handover",
      "Dedicated Senior Lead Engineer",
    ],
  },
];

const AVAILABLE_ADDONS: Addon[] = [
  {
    id: "addon-express",
    title: "Superfast Express Delivery (48h)",
    price: 2500,
    description: "Dedicated sprint priority to finish and stage your build in record time.",
  },
  {
    id: "addon-seo",
    title: "Full SEO & Schema Mastery",
    price: 2000,
    description: "Deep structured schema markup, sitemap generation, and meta keyword research.",
  },
  {
    id: "addon-cms",
    title: "Dynamic CMS Content Engine",
    price: 3500,
    description: "Admin panel to publish blogs, case studies, or portfolio items anytime.",
  },
  {
    id: "addon-paytm",
    title: "Payment Gateway Setup",
    price: 4000,
    description: "Paytm / UPI automated merchant checkout integration for your business.",
  },
];

function PricingContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected plan & requirements modal
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Section Category Filter State
  const [packageCategory, setPackageCategory] = useState<"all" | "essential" | "professional" | "enterprise">("all");

  // Form inputs
  const [name, setName] = useState(user?.displayName || profile?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [company, setCompany] = useState("");
  const [details, setDetails] = useState("");
  const [timeline, setTimeline] = useState("Within 2 weeks");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"form" | "payment" | "success">("form");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // ── Coupon & Promo Code State ──
  const [bannerCoupons, setBannerCoupons] = useState<any[]>([]);
  const [publicOffers, setPublicOffers] = useState<any[]>([]);
  const [isEligibleForBanner, setIsEligibleForBanner] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState<"first_time" | "loyal" | "guest">("guest");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [copiedBannerCode, setCopiedBannerCode] = useState<string | null>(null);

  // ── Payment Gateway & Manual Mode State ──
  const [paymentSettings, setPaymentSettings] = useState<{
    paymentMode: "manual" | "paytm";
    upiId: string;
    upiName: string;
    upiNumber?: string;
    qrCodeUrl?: string;
    paymentInstructions?: string;
  }>({
    paymentMode: "manual",
    upiId: "paytmqr281005050101y218u1d161d0@paytm",
    upiName: "Runix Web Technologies",
    paymentInstructions:
      "Scan the QR code or pay via UPI. After payment, enter your 12-digit UTR transaction ID below to verify your sprint.",
  });
  const [utrInput, setUtrInput] = useState("");
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // ── Fetch Active Promo Banners, Public Deals, Payment Settings & Check User Eligibility ──
  useEffect(() => {
    const fetchBannersAndEligibility = async () => {
      try {
        const now = Date.now();

        // 0. Fetch Payment Configuration Settings
        try {
          const paymentSnap = await getDoc(doc(db, "settings", "payment"));
          if (paymentSnap.exists()) {
            const pData = paymentSnap.data();
            setPaymentSettings({
              paymentMode: pData.paymentMode || "manual",
              upiId: pData.upiId || "paytmqr281005050101y218u1d161d0@paytm",
              upiName: pData.upiName || "Runix Web Technologies",
              upiNumber: pData.upiNumber || "",
              qrCodeUrl: pData.qrCodeUrl || "",
              paymentInstructions:
                pData.paymentInstructions ||
                "Scan the QR code or pay via UPI. After payment, enter your 12-digit UTR transaction ID below to verify your sprint.",
            });
          }
        } catch (payErr) {
          console.warn("Payment settings fetch notice:", payErr);
        }

        // 1. Fetch active coupons
        const couponsSnap = await getDocs(collection(db, "coupons"));
        const activeBanners = couponsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((c) => {
            if (!c.isActive || !c.showAsBanner) return false;
            const start = new Date(c.startDate).getTime();
            const end = new Date(c.endDate).getTime();
            if (now < start || now > end) return false;
            if (c.usageLimit > 0 && (c.usedCount || 0) >= c.usageLimit) return false;
            const userIdentifier = user?.uid || user?.email?.toLowerCase();
            if (userIdentifier && c.usedByUsers && c.usedByUsers.includes(userIdentifier)) return false;
            return true;
          });

        setBannerCoupons(activeBanners);

        // 2. Fetch active broadcast offers for public showcase
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

        setPublicOffers(activeOffers);

        // Check user eligibility (first-time vs loyal)
        if (!user) {
          setIsEligibleForBanner(true);
          setEligibilityReason("guest");
        } else {
          try {
            const ordersSnap = await getDocs(
              query(
                collection(db, "orders"),
                where("userId", "==", user.uid)
              )
            );
            const userOrders = ordersSnap.docs.map((d) => d.data());

            if (userOrders.length === 0) {
              setIsEligibleForBanner(true);
              setEligibilityReason("first_time");
            } else {
              const completedCount = userOrders.filter((o: any) => o.status === "completed").length;
              if (completedCount >= 3) {
                setIsEligibleForBanner(true);
                setEligibilityReason("loyal");
              } else {
                setIsEligibleForBanner(false);
              }
            }
          } catch (orderErr) {
            setIsEligibleForBanner(true);
            setEligibilityReason("first_time");
          }
        }
      } catch (err) {
        console.warn("Banner coupons fetch notice:", err);
      }
    };

    fetchBannersAndEligibility();
  }, [user]);

  // ── Auto-Apply Coupon from URL Search Params (e.g. /pricing?coupon=LAUNCH50) ──
  useEffect(() => {
    const urlCoupon = searchParams.get("coupon");
    if (urlCoupon) {
      setCouponInput(urlCoupon.trim().toUpperCase());
      handleApplyCoupon(urlCoupon.trim().toUpperCase());
    }
  }, [searchParams]);

  // ── Price Calculation Helpers ──

  const getAddonsSum = () => {
    return selectedAddons.reduce((acc, addonId) => {
      const addon = AVAILABLE_ADDONS.find((a) => a.id === addonId);
      return acc + (addon?.price || 0);
    }, 0);
  };

  const getRawTotal = (plan: PlanTier) => {
    return plan.totalPrice + getAddonsSum();
  };

  const getDiscountForPlan = (plan: PlanTier) => {
    if (!appliedCoupon) return 0;

    const scope = appliedCoupon.scope || "all";

    // Maintenance coupons do not apply to website build plans
    if (scope === "maintenance") return 0;

    const rawTotal = getRawTotal(plan);
    if (appliedCoupon.minOrderValue && rawTotal < appliedCoupon.minOrderValue) {
      return 0;
    }

    let discountBaseAmount = rawTotal;

    // If scope is plan-specific
    if (scope === "plans") {
      const applicablePlans = appliedCoupon.applicablePlans || ["all"];
      if (!applicablePlans.includes("all") && !applicablePlans.includes(plan.id)) {
        return 0;
      }
      discountBaseAmount = plan.totalPrice;
    }

    // If scope is addon-specific
    if (scope === "addons") {
      const applicableAddons = appliedCoupon.applicableAddons || ["all"];
      const matchingSelected = applicableAddons.includes("all")
        ? selectedAddons
        : selectedAddons.filter((a) => applicableAddons.includes(a));

      if (matchingSelected.length === 0) return 0;

      discountBaseAmount = matchingSelected.reduce((sum, addonId) => {
        const ad = AVAILABLE_ADDONS.find((a) => a.id === addonId);
        return sum + (ad?.price || 0);
      }, 0);
    }

    let discount = 0;
    if (appliedCoupon.type === "percentage") {
      discount = Math.round(discountBaseAmount * (appliedCoupon.value / 100));
      if (appliedCoupon.maxDiscount && appliedCoupon.maxDiscount > 0) {
        discount = Math.min(discount, appliedCoupon.maxDiscount);
      }
    } else {
      discount = Math.min(appliedCoupon.value, discountBaseAmount);
    }

    return Math.min(discount, rawTotal);
  };

  const calculateTotal = (plan: PlanTier) => {
    const raw = getRawTotal(plan);
    const discount = getDiscountForPlan(plan);
    return Math.max(0, raw - discount);
  };

  const calculateAdvance = (plan: PlanTier) => {
    const total = calculateTotal(plan);
    return Math.round(total * 0.5);
  };

  const calculateFinal = (plan: PlanTier) => {
    const total = calculateTotal(plan);
    return total - calculateAdvance(plan);
  };

  // ── Coupon Validation & Apply Handler ──
  const handleApplyCoupon = async (codeOverride?: string) => {
    const targetCode = (codeOverride || couponInput).trim().toUpperCase();
    if (!targetCode) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const couponsSnap = await getDocs(
        query(collection(db, "coupons"), where("code", "==", targetCode))
      );

      if (couponsSnap.empty) {
        setCouponError(`Invalid coupon code "${targetCode}". Please verify and try again.`);
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      const couponDoc = couponsSnap.docs[0];
      const coupon = couponDoc.data() as any;

      if (!coupon.isActive) {
        setCouponError("This coupon is no longer active.");
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      const now = Date.now();
      if (coupon.startDate && now < new Date(coupon.startDate).getTime()) {
        setCouponError("This coupon promotion has not started yet.");
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      if (coupon.endDate && now > new Date(coupon.endDate).getTime()) {
        setCouponError("This coupon code has expired.");
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      const scope = coupon.scope || "all";
      if (scope === "maintenance") {
        setCouponError("This coupon code is valid exclusively for Website Maintenance Retainers.");
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      if (coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) {
        setCouponError("This coupon has reached its maximum usage limit and is fully redeemed.");
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      const userIdentifier = user?.uid || email.trim().toLowerCase() || user?.email?.toLowerCase();
      if (userIdentifier && coupon.usedByUsers && coupon.usedByUsers.includes(userIdentifier)) {
        setCouponError("You have already used this coupon code.");
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }

      // If a plan is already selected, check plan eligibility
      if (selectedPlan && scope === "plans") {
        const applicablePlans: string[] = coupon.applicablePlans || ["all"];
        if (!applicablePlans.includes("all") && !applicablePlans.includes(selectedPlan.id)) {
          setCouponError(`This coupon is only valid for ${applicablePlans.join(", ")} packages.`);
          setAppliedCoupon(null);
          setCouponLoading(false);
          return;
        }
      }

      // If scope is addons, check if matching addon is selected
      if (selectedPlan && scope === "addons") {
        const applicableAddons: string[] = coupon.applicableAddons || ["all"];
        const matchingSelected = applicableAddons.includes("all")
          ? selectedAddons
          : selectedAddons.filter((a) => applicableAddons.includes(a));

        if (matchingSelected.length === 0) {
          setCouponError("This coupon applies to add-ons. Please select an applicable add-on booster.");
        }
      }

      setAppliedCoupon({
        id: couponDoc.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        minOrderValue: coupon.minOrderValue,
        scope: scope,
        applicablePlans: coupon.applicablePlans || ["all"],
        applicableAddons: coupon.applicableAddons || ["all"],
      });
      setCouponInput(coupon.code);
      setCouponError(null);
    } catch (err: any) {
      console.error("Coupon validation error:", err);
      setCouponError("Failed to validate coupon. Please try again.");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const handleSelectPlan = (plan: PlanTier) => {
    setSelectedPlan(plan);
    if (!name && (user?.displayName || profile?.name)) {
      setName(user?.displayName || profile?.name || "");
    }
    if (!email && user?.email) {
      setEmail(user.email);
    }
    setShowCheckoutModal(true);
    setCheckoutStep("form");
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!name.trim() || !email.trim()) {
      alert("Please enter your name and email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const total = calculateTotal(selectedPlan);
      const advance = calculateAdvance(selectedPlan);
      const final = calculateFinal(selectedPlan);

      // Create order via API with atomic coupon validation
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: selectedPlan.name,
          totalPrice: getRawTotal(selectedPlan),
          advancePrice: advance,
          finalPrice: final,
          userId: user?.uid || null,
          userEmail: email.trim().toLowerCase(),
          couponCode: appliedCoupon?.code || null,
          formData: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            company: company.trim(),
            projectType: selectedPlan.name,
            timeline,
            details: details.trim(),
            addons: selectedAddons,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create project order");
      }

      setCreatedOrderId(data.orderId);

      // If a custom token was generated for guest, automatically sign them in
      if (data.customAuthToken && !user) {
        try {
          await signInWithCustomToken(auth, data.customAuthToken);
        } catch (tokenErr) {
          console.warn("Auto sign-in notice:", tokenErr);
        }
      }

      setCheckoutStep("payment");
    } catch (err: any) {
      console.error("Order creation error:", err);
      alert(err.message || "Failed to submit project inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayAdvanceWithPaytm = async () => {
    if (!selectedPlan || !createdOrderId) return;
    setIsSubmitting(true);

    try {
      const advance = calculateAdvance(selectedPlan);
      const initRes = await fetch("/api/payments/paytm/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: createdOrderId,
          amount: advance,
          userEmail: email.trim().toLowerCase(),
          userId: user?.uid || "guest",
          paymentType: "advance_50",
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.error || "Failed to initiate online payment session");
      }

      if (initData.simulated) {
        // Simulated payment flow when Paytm credentials are not configured
        await fetch(`/api/payments/paytm/callback?orderId=${createdOrderId}&milestone=advance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            STATUS: "TXN_SUCCESS",
            ORDERID: initData.orderId,
            TXNAMOUNT: advance.toString(),
            TXNID: `PAYTM_SIM_${Date.now()}`,
            simulated: true,
          }),
        });

        alert("50% Advance payment simulated & confirmed successfully! Opening your project workspace...");
        router.push("/dashboard/workspace");
        return;
      }

      // Live Paytm Gateway Form POST
      const paytmHost = initData.host || "securegw.paytm.in";
      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", `https://${paytmHost}/theia/api/v1/showPaymentPage?mid=${initData.mid}&orderId=${initData.orderId}`);

      const params: Record<string, string> = {
        mid: initData.mid,
        orderId: initData.orderId,
        txnToken: initData.txnToken,
      };

      Object.entries(params).forEach(([key, val]) => {
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("name", key);
        input.setAttribute("value", val);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      alert(err.message || "Failed to connect to payment gateway. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedPlans = packageCategory === "all" ? PLANS : PLANS.filter((p) => p.id === packageCategory);

  return (
    <div className="flex flex-col w-full items-center relative bg-[#050505] overflow-hidden min-h-screen">
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-10" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[60vh] bg-indigo-500/10 blur-[160px] pointer-events-none rounded-full" />

      {/* ── Hero Section ── */}
      <section className="relative w-full pt-32 md:pt-36 pb-10 px-4 z-10 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Milestone-Driven Pricing
          </div>

          <h1 className="font-jakarta text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-[0.9]">
            Transparent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              50 / 50 Payments
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
            Pay <span className="text-white font-bold">50% advance</span> to kickstart development. Pay the remaining{" "}
            <span className="text-white font-bold">50% balance</span> only after you review and approve your live staging demo.
          </p>

          {/* ── Auto-Promotional Coupon Banner for Eligible Clients ── */}
          {isEligibleForBanner && bannerCoupons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto mt-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-indigo-950/30 to-purple-950/40 border border-emerald-500/30 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-inner">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {eligibilityReason === "loyal"
                        ? "VIP Loyal Client Perk"
                        : "First-Time Client Special"}
                    </span>
                    {bannerCoupons[0].usageLimit > 0 && (
                      <span className="text-[10px] text-zinc-400">
                        Only {Math.max(0, bannerCoupons[0].usageLimit - (bannerCoupons[0].usedCount || 0))} spots left!
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white mt-1">
                    {bannerCoupons[0].bannerText ||
                      `Save ${bannerCoupons[0].type === "percentage" ? `${bannerCoupons[0].value}%` : `₹${bannerCoupons[0].value.toLocaleString()}`} on your development sprint!`}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <div className="px-3.5 py-2 rounded-xl bg-black/60 border border-emerald-500/40 font-mono font-black text-emerald-300 text-xs sm:text-sm tracking-wider flex items-center gap-2">
                  <span>{bannerCoupons[0].code}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bannerCoupons[0].code);
                      setCopiedBannerCode(bannerCoupons[0].code);
                      setTimeout(() => setCopiedBannerCode(null), 2500);
                    }}
                    className="text-zinc-400 hover:text-white cursor-pointer"
                    title="Copy promo code"
                  >
                    {copiedBannerCode === bannerCoupons[0].code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <Button
                  onClick={() => {
                    handleApplyCoupon(bannerCoupons[0].code);
                    const el = document.getElementById("pricing-tiers");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  variant="accent"
                  size="sm"
                  className="rounded-xl text-xs font-bold px-4 py-2 shrink-0 flex items-center gap-1.5"
                >
                  {appliedCoupon?.code === bannerCoupons[0].code ? "Applied ✓" : "Apply Code"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* 4-Step Milestone Flow Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto text-left">
            {[
              { step: "01", title: "50% Advance Deposit", desc: "Locks in timeline & starts build" },
              { step: "02", title: "Active Sprint", desc: "Live developer room & progress" },
              { step: "03", title: "Staging Preview", desc: "Test & review live build demo" },
              { step: "04", title: "50% & Handover", desc: "Pay balance & receive all assets" },
            ].map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
              >
                <span className="text-indigo-400 text-xs font-mono font-bold">{m.step}</span>
                <div className="mt-3">
                  <h4 className="text-xs font-bold text-white leading-tight">{m.title}</h4>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Pricing Tiers Section ── */}
      <section id="pricing-tiers" className="py-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Package Classification / Filtration Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {[
            { id: "all", label: "All Packages", badge: "Overview" },
            { id: "essential", label: "Landing Pages", badge: "3–5 Days" },
            { id: "professional", label: "Business Websites", badge: "7–10 Days" },
            { id: "enterprise", label: "Web Apps & MVP", badge: "14–21 Days" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setPackageCategory(cat.id as any)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                packageCategory === cat.id
                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105"
                  : "bg-white/[0.03] text-zinc-400 border-white/10 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  packageCategory === cat.id ? "bg-black/15 text-black" : "bg-white/10 text-zinc-300"
                }`}
              >
                {cat.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Pricing Cards Grid */}
        <div className={`grid gap-8 items-stretch ${
          packageCategory === "all" ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 max-w-xl mx-auto"
        }`}>
          {displayedPlans.map((plan, index) => {
            const isPop = plan.popular;
            const discount = getDiscountForPlan(plan);
            const discountedTotal = calculateTotal(plan);
            const advance = calculateAdvance(plan);
            const final = calculateFinal(plan);
            const hasDiscount = discount > 0;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`relative rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between transition-all backdrop-blur-xl group ${
                  isPop
                    ? "bg-gradient-to-b from-indigo-950/40 via-zinc-900/90 to-black border-2 border-indigo-500/40 shadow-2xl shadow-indigo-500/10"
                    : "bg-zinc-900/40 border border-white/10 hover:border-white/20"
                }`}
              >
                {isPop && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-extrabold uppercase tracking-widest shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Header: Title + Delivery Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">
                        {plan.name} Package
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-white font-jakarta tracking-tight mt-1">
                        {plan.name}
                      </h3>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-300 shrink-0 whitespace-nowrap">
                      {plan.delivery}
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                    {plan.description}
                  </p>

                  {/* Price Box with Discount & 50/50 Split */}
                  <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-zinc-400">Total Project Cost</span>
                      <div className="text-right">
                        {hasDiscount && (
                          <span className="text-sm line-through text-zinc-500 mr-2 font-mono">
                            ₹{plan.totalPrice.toLocaleString()}
                          </span>
                        )}
                        <span className={`text-3xl font-black tracking-tight ${hasDiscount ? "text-emerald-400" : "text-white"}`}>
                          ₹{discountedTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {hasDiscount && (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> {appliedCoupon?.code} applied
                        </span>
                        <span className="font-bold font-mono">−₹{discount.toLocaleString()} OFF</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider">
                          50% Advance:
                        </span>
                        <span className="text-sm font-extrabold text-white">
                          ₹{advance.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                        <span className="text-[10px] text-purple-400 font-bold block uppercase tracking-wider">
                          50% at Handover:
                        </span>
                        <span className="text-sm font-extrabold text-white">
                          ₹{final.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                      Everything Included:
                    </span>
                    <ul className="space-y-2.5">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    variant={isPop ? "accent" : "outline"}
                    className="w-full h-14 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    Select {plan.name} Plan <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Addons & Custom Requirements Section ── */}
      <section className="py-16 w-full max-w-5xl px-4 sm:px-6 relative z-10">
        <div className="rounded-[2.5rem] p-8 md:p-12 bg-zinc-900/40 border border-white/10 backdrop-blur-xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-4xl font-bold font-jakarta text-white tracking-tight">
              Optional Add-ons & Boosters
            </h2>
            <p className="text-sm text-zinc-400">
              Customize your package with specialized services. All add-ons also follow the 50% advance / 50% handover split.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AVAILABLE_ADDONS.map((addon) => {
              const isSelected = selectedAddons.includes(addon.id);
              return (
                <div
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "bg-indigo-500/10 border-indigo-500/50"
                      : "bg-black/40 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{addon.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{addon.description}</p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-indigo-500 border-indigo-400 text-white"
                          : "border-white/20 bg-white/5"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/5">
                    <span className="text-zinc-500">Add-on Price</span>
                    <span className="text-white font-bold">+₹{addon.price.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Public Offers & Deals Showcase Section ── */}
      {publicOffers.length > 0 && (
        <section className="py-12 w-full max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Limited-Time Deals
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">Active Platform Deals & Specials</h2>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
              <Link href="/offers" className="flex items-center gap-1.5">
                View All Deals <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicOffers.slice(0, 3).map((offer, idx) => (
              <div
                key={offer.id || idx}
                className="p-6 rounded-3xl bg-zinc-900/40 border border-white/10 flex flex-col justify-between space-y-4 backdrop-blur-xl hover:border-indigo-500/30 transition-all"
              >
                <div className="space-y-2.5">
                  {offer.discountBadge && (
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-bold text-xs">
                      {offer.discountBadge}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-white">{offer.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{offer.description}</p>
                </div>

                <div className="space-y-3 pt-2">
                  {offer.promoCode && (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-indigo-300">{offer.promoCode}</span>
                      <button
                        onClick={() => {
                          handleApplyCoupon(offer.promoCode);
                          const el = document.getElementById("pricing-tiers");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                      >
                        {appliedCoupon?.code === offer.promoCode ? "Applied ✓" : "Apply to Cart"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ Section ── */}
      <section className="py-16 w-full max-w-4xl px-4 relative z-10 mb-24">
        <h2 className="text-2xl md:text-3xl font-bold font-jakarta text-white tracking-tight text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "How does the 50/50 Milestone Payment model work?",
              a: "You pay 50% upfront to initiate sprint development. We assign your lead developer, build the architecture, and deliver a live staging preview demo. You review and approve the demo, and only then pay the final 50% balance before full code & deployment handover.",
            },
            {
              q: "How do coupon codes and discounts apply?",
              a: "You can apply any valid promo code during checkout. The discount is deducted directly from the total project fee, and both the 50% advance and 50% final payments are automatically recalculated on the discounted balance.",
            },
            {
              q: "Can coupons be applied to Add-ons or Website Maintenance?",
              a: "Yes! Some promo codes specifically target Add-on boosters or ongoing monthly Website Maintenance Retainers. These discounts are applied automatically when selecting applicable options.",
            },
            {
              q: "Do I need to sign up or create an account first?",
              a: "No! You can choose any plan and enter your project requirements directly. If you don't have an account yet, one is created seamlessly in the background and linked to your project workspace.",
            },
            {
              q: "What payment methods are accepted?",
              a: "We support Paytm for Business gateway, all UPI apps (Google Pay, PhonePe, Paytm, BHIM), QR code scan, Debit/Credit Cards, and NetBanking.",
            },
          ].map((faq, i) => (
            <div key={i} className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 space-y-2">
              <h4 className="text-base font-bold text-white">{faq.q}</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Checkout & Requirements Drawer Modal ── */}
      <AnimatePresence>
        {showCheckoutModal && selectedPlan && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              onClick={() => setShowCheckoutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-[#111] border border-white/15 rounded-3xl w-full max-w-2xl p-6 sm:p-8 relative shadow-2xl my-8">
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="absolute top-5 right-5 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Modal Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {checkoutStep === "form"
                        ? `Configure: ${selectedPlan.name} Plan`
                        : checkoutStep === "payment"
                        ? "Confirm 50% Advance Payment"
                        : "Project Initialized!"}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {checkoutStep === "form"
                        ? "Enter your project specifications, promo code, and contact info"
                        : "Pay 50% advance to start development sprint"}
                    </p>
                  </div>
                </div>

                {/* Price Breakdown Banner with Discount */}
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 mb-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Total Project Cost:</span>
                      <div className="flex items-baseline gap-2">
                        {getDiscountForPlan(selectedPlan) > 0 && (
                          <span className="text-sm line-through text-zinc-500 font-mono">
                            ₹{getRawTotal(selectedPlan).toLocaleString()}
                          </span>
                        )}
                        <span className={`text-xl font-black ${getDiscountForPlan(selectedPlan) > 0 ? "text-emerald-400" : "text-white"}`}>
                          ₹{calculateTotal(selectedPlan).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <span className="text-[10px] text-indigo-400 font-bold block uppercase">
                          50% Advance Due Now:
                        </span>
                        <span className="text-sm font-extrabold text-white">
                          ₹{calculateAdvance(selectedPlan).toLocaleString()}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <span className="text-[10px] text-purple-400 font-bold block uppercase">
                          50% on Handover:
                        </span>
                        <span className="text-sm font-extrabold text-white">
                          ₹{calculateFinal(selectedPlan).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {getDiscountForPlan(selectedPlan) > 0 && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-emerald-300">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Tag className="w-3.5 h-3.5" /> Coupon Savings ({appliedCoupon?.code}):
                      </span>
                      <span className="font-mono font-bold">−₹{getDiscountForPlan(selectedPlan).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Coupon / Promo Code Input Section */}
                {checkoutStep === "form" && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-400" /> Have a Promo / Coupon Code?
                      </label>
                      {appliedCoupon && (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          Remove Coupon ✕
                        </button>
                      )}
                    </div>

                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                            placeholder="Enter code (e.g. LAUNCH50)"
                            className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-2 text-xs font-mono font-bold uppercase text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={couponLoading || !couponInput.trim()}
                          variant="accent"
                          size="sm"
                          className="rounded-xl px-4 text-xs font-bold h-9 shrink-0"
                        >
                          {couponLoading ? "Checking..." : "Apply"}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white font-mono">{appliedCoupon.code}</span>
                            <span className="text-[11px] text-emerald-300 ml-2">
                              ({appliedCoupon.type === "percentage" ? `${appliedCoupon.value}% OFF` : `₹${appliedCoupon.value.toLocaleString()} OFF`} applied!)
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-extrabold text-emerald-300">
                          −₹{getDiscountForPlan(selectedPlan).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {couponError && (
                      <div className="text-[11px] text-red-400 flex items-center gap-1.5 pt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{couponError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 1: Form */}
                {checkoutStep === "form" && (
                  <form onSubmit={handleProceedToPayment} className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">
                          Your Full Name <span className="text-indigo-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">
                          Email Address <span className="text-indigo-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">
                          Company / Brand Name <span className="text-zinc-600">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Acme Studio"
                          className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">
                          Target Timeline
                        </label>
                        <select
                          value={timeline}
                          onChange={(e) => setTimeline(e.target.value)}
                          className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="As soon as possible">As soon as possible (Sprint)</option>
                          <option value="Within 1 week">Within 1 week</option>
                          <option value="Within 2 weeks">Within 2 weeks</option>
                          <option value="Within 1 month">Within 1 month</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">
                        Project Brief & References <span className="text-indigo-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Describe your website goals, required pages/features, reference websites you like, or existing brand colors..."
                        className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                      <Button
                        type="button"
                        onClick={() => setShowCheckoutModal(false)}
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="accent"
                        size="sm"
                        className="rounded-xl flex items-center gap-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          "Processing..."
                        ) : (
                          <>
                            Proceed to 50% Advance (₹{calculateAdvance(selectedPlan).toLocaleString()}){" "}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Step 2: Payment */}
                {checkoutStep === "payment" && (
                  <div className="space-y-6">
                    {paymentSettings.paymentMode === "manual" ? (
                      /* ── Manual UPI / QR Code & UTR Verification Mode (Zero API Keys Needed) ── */
                      <div className="space-y-5">
                        <div className="p-5 rounded-2xl bg-black/60 border border-white/10 text-center space-y-4">
                          <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                            <IndianRupee className="w-4 h-4" /> Scan & Pay 50% Advance via UPI
                          </div>

                          {/* Dynamic / Custom QR Code */}
                          <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center border border-white/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                paymentSettings.qrCodeUrl ||
                                `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                                  `upi://pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(
                                    paymentSettings.upiName
                                  )}&am=${calculateAdvance(selectedPlan)}&cu=INR`
                                )}`
                              }
                              alt="Scan UPI QR Code"
                              className="w-full h-full object-contain rounded-xl"
                            />
                          </div>

                          <div className="space-y-1 text-center">
                            <p className="text-xs text-zinc-400">
                              Scan using any UPI App (Google Pay, PhonePe, Paytm, BHIM)
                            </p>
                            <div className="text-2xl font-black text-white pt-1">
                              ₹{calculateAdvance(selectedPlan).toLocaleString()}
                            </div>
                            {getDiscountForPlan(selectedPlan) > 0 && (
                              <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20">
                                {appliedCoupon?.code} applied (−₹{getDiscountForPlan(selectedPlan).toLocaleString()} Discount)
                              </span>
                            )}
                          </div>

                          {/* UPI ID with Copy Button */}
                          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-left">
                            <div className="min-w-0">
                              <span className="text-[10px] text-zinc-500 uppercase block font-bold">Pay to UPI ID:</span>
                              <span className="text-xs font-mono font-bold text-indigo-300 truncate block">
                                {paymentSettings.upiId}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentSettings.upiId);
                                setCopiedUpi(true);
                                setTimeout(() => setCopiedUpi(false), 2500);
                              }}
                              className="rounded-lg text-[11px] h-8 shrink-0 flex items-center gap-1.5"
                            >
                              {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedUpi ? "Copied" : "Copy UPI"}
                            </Button>
                          </div>
                        </div>

                        {/* UTR Input Form */}
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!utrInput.trim()) {
                              alert("Please enter the 12-digit UTR / UPI Reference ID from your payment app");
                              return;
                            }
                            if (!createdOrderId) return;
                            setSubmittingUtr(true);
                            try {
                              await updateDoc(doc(db, "orders", createdOrderId), {
                                utrNumber: utrInput.trim(),
                                paymentMethod: "upi_manual",
                                status: "awaiting_verification",
                                updatedAt: new Date().toISOString(),
                              });
                              setCheckoutStep("success");
                            } catch (err: any) {
                              console.error("UTR submission error:", err);
                              alert(err.message || "Failed to submit UTR reference. Please try again.");
                            } finally {
                              setSubmittingUtr(false);
                            }
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                              Enter 12-Digit UTR / Transaction Reference ID <span className="text-indigo-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={utrInput}
                              onChange={(e) => setUtrInput(e.target.value)}
                              placeholder="e.g. 329104829104"
                              className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                            />
                            <p className="text-[11px] text-zinc-500 mt-1">
                              Found on your payment app receipt under "UTR", "UPI Ref No", or "Transaction ID".
                            </p>
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-2">
                            <Button
                              type="button"
                              onClick={() => setCheckoutStep("form")}
                              variant="ghost"
                              size="sm"
                              className="rounded-xl"
                            >
                              Back
                            </Button>
                            <Button
                              type="submit"
                              variant="accent"
                              size="sm"
                              disabled={submittingUtr || !utrInput.trim()}
                              className="rounded-xl flex items-center gap-2 h-11 px-6 font-bold"
                            >
                              {submittingUtr ? (
                                "Submitting..."
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" /> Submit UTR & Confirm Advance
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      /* ── Automated Paytm Gateway API Mode ── */
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white">Pay Advance via Paytm for Business</h4>
                            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                              Pay securely using any UPI app (GPay, PhonePe, Paytm, BHIM), QR code scan, or Cards.
                            </p>
                          </div>
                          <div className="text-2xl font-black text-white pt-2">
                            ₹{calculateAdvance(selectedPlan).toLocaleString()}
                          </div>
                          {getDiscountForPlan(selectedPlan) > 0 && (
                            <span className="inline-block text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                              {appliedCoupon?.code} applied (−₹{getDiscountForPlan(selectedPlan).toLocaleString()} Total Discount)
                            </span>
                          )}
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-xs text-zinc-400">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <ShieldCheck className="w-4 h-4" /> Zero-Risk 50/50 Guarantee
                          </div>
                          <p>
                            Your 50% advance locks in development. Your remaining balance is only payable after you test and
                            approve the live staging URL.
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                          <Button
                            onClick={() => setCheckoutStep("form")}
                            variant="ghost"
                            size="sm"
                            className="rounded-xl"
                          >
                            Back
                          </Button>
                          <Button
                            onClick={handlePayAdvanceWithPaytm}
                            variant="accent"
                            size="sm"
                            className="rounded-xl flex items-center gap-2 h-11 px-6"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              "Connecting to Paytm..."
                            ) : (
                              <>
                                <Zap className="w-4 h-4" /> Pay ₹{calculateAdvance(selectedPlan).toLocaleString()} with Paytm
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Success */}
                {checkoutStep === "success" && (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-white">
                      {paymentSettings.paymentMode === "manual"
                        ? "Deposit Reference Submitted!"
                        : "Payment Received & Project Activated!"}
                    </h3>
                    <p className="text-sm text-zinc-400 max-w-md mx-auto">
                      {paymentSettings.paymentMode === "manual"
                        ? "Your 12-digit UTR reference has been recorded. Our team is verifying your payment and setting up your developer workspace."
                        : "Your 50% advance has been confirmed. Redirecting you to your dedicated project workspace..."}
                    </p>
                    <div className="pt-3">
                      <Button variant="accent" size="sm" asChild className="rounded-xl font-bold">
                        <Link href="/dashboard/workspace">Open Project Workspace →</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-xs text-zinc-500">Loading pricing plans...</div>}>
      <PricingContent />
    </Suspense>
  );
}
