"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  FolderKanban,
  CreditCard,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ExternalLink,
  IndianRupee,
  Copy,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Shield,
  HelpCircle,
  Send,
  MessageSquare,
  MessageCircle,
} from "lucide-react";
import DeveloperInteractionRoom from "@/components/dashboard/DeveloperInteractionRoom";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
}

interface Order {
  id: string;
  planName: string;
  price: number;
  currency: string;
  status: string;
  createdAt: any;
  utrNumber?: string;
  adminQuery?: string;
  userResponse?: string;
  hasPendingQuery?: boolean;
}

interface PaymentSettings {
  upiId: string;
  upiNumber: string;
}

const fadeUp: any = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Multi-step form
  const [step, setStep] = useState<"idle" | "form" | "payment" | "done">(
    "idle"
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    projectType: "",
    budget: "",
    timeline: "",
    details: "",
  });
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Query Response State
  const [respondingOrderId, setRespondingOrderId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // User UTR Submission for existing orders
  const [submittingUtrForOrder, setSubmittingUtrForOrder] = useState<string | null>(null);
  const [userUtrInput, setUserUtrInput] = useState("");

  // Developer Room toggle
  const [openRoomOrderId, setOpenRoomOrderId] = useState<string | null>(null);

  const handleUserSubmitUtr = async (orderId: string) => {
    if (!userUtrInput.trim()) return;
    try {
      await updateDoc(doc(db, "orders", orderId), {
        utrNumber: userUtrInput.trim(),
        status: "awaiting_verification",
      });
      setOrders((prev: any[]) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, utrNumber: userUtrInput.trim(), status: "awaiting_verification" }
            : o
        )
      );
      setSubmittingUtrForOrder(null);
      setUserUtrInput("");
      alert("UTR submitted! Our team will verify your payment shortly.");
    } catch (e) {
      console.error("Failed to submit UTR:", e);
      alert("Failed to submit UTR");
    }
  };

  const handleRespondToQuery = async (orderId: string) => {
    if (!responseText.trim()) return;
    setSubmittingResponse(true);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        userResponse: responseText.trim(),
        hasPendingQuery: false,
        responseCreatedAt: new Date().toISOString(),
      });

      setOrders((prev: any[]) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, userResponse: responseText.trim(), hasPendingQuery: false }
            : o
        )
      );
      setRespondingOrderId(null);
      setResponseText("");
      alert("Response submitted to admin!");
    } catch (err) {
      console.error("Failed to submit response:", err);
      alert("Failed to submit response. Please try again.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch profile
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        setFormData((prev) => ({
          ...prev,
          name: data.name || user.displayName || "",
          email: data.email || user.email || "",
        }));
      } else {
        setProfile({
          name: user.displayName || "User",
          email: user.email || "",
          phone: "N/A",
          location: "N/A",
        });
        setFormData((prev) => ({
          ...prev,
          name: user.displayName || "",
          email: user.email || "",
        }));
      }

      // Fetch orders
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setOrders(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
        );
      } catch (err) {
        console.error("Error fetching orders:", err);
      }

      // Fetch payment settings
      try {
        const payDocSnap = await getDoc(doc(db, "settings", "payment"));
        if (payDocSnap.exists()) {
          setPaymentSettings(payDocSnap.data() as PaymentSettings);
        }
      } catch (err) {
        console.error("Error fetching payment settings:", err);
      }
    };

    fetchData();
  }, [user]);

  const handleFormSubmit = () => {
    if (!formData.name || !formData.email || !formData.projectType || !formData.budget || !formData.details) {
      alert("Please fill all required fields");
      return;
    }
    setStep("payment");
  };

  const handleUtrSubmit = async () => {
    if (!utrNumber.trim()) {
      alert("Please enter your UTR number");
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Parse the price from budget
      const priceMatch = formData.budget.match(/₹([\d,]+)/);
      const price = priceMatch
        ? parseInt(priceMatch[1].replace(/,/g, ""))
        : 0;

      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userEmail: user.email,
        planName: formData.projectType,
        price,
        currency: "₹",
        status: "awaiting_verification",
        paymentMethod: "upi_manual",
        utrNumber: utrNumber.trim(),
        formData: {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          projectType: formData.projectType,
          budget: formData.budget,
          timeline: formData.timeline,
          details: formData.details,
        },
        createdAt: serverTimestamp(),
      });

      setStep("done");

      // Refresh orders
      const q = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    } catch (err) {
      console.error("Failed to submit order:", err);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const resetForm = () => {
    setStep("idle");
    setFormData({
      name: profile?.name || user?.displayName || "",
      email: profile?.email || user?.email || "",
      company: "",
      projectType: "",
      budget: "",
      timeline: "",
      details: "",
    });
    setUtrNumber("");
  };

  const firstName =
    profile?.name?.split(" ")[0] ||
    user?.displayName?.split(" ")[0] ||
    "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const inputClasses =
    "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors font-medium";
  const labelClasses =
    "text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Welcome Banner ── */}
      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-[#111] to-purple-600/10 border border-white/5 p-8 sm:p-10"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Dashboard
          </div>
          <h1 className="font-jakarta text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
            {greeting}, {firstName}
          </h1>
          <p className="text-zinc-400 text-base max-w-lg">
            Here's an overview of your account, active projects, and recent
            activity.
          </p>
        </div>
      </motion.div>

      {/* ── Multi-Step Project & Payment Flow ── */}
      <AnimatePresence mode="wait">
        {step === "idle" && (
          <motion.div
            key="start-project"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-gradient-to-r from-indigo-900/20 to-purple-900/10 border border-indigo-500/20 rounded-2xl p-6 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  Start a New Project
                </h3>
                <p className="text-zinc-400 text-sm">
                  Submit your project requirements, choose a budget, make
                  payment, and get started.
                </p>
              </div>
              <Button
                onClick={() => setStep("form")}
                variant="accent"
                className="rounded-xl h-11 px-6 text-sm shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "form" && (
          <motion.div
            key="form-step"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-[#111] border border-white/5 rounded-2xl p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={resetForm}
                className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Project Requirements
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Step 1 of 2 — Tell us about your project
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-8">
              <div className="flex-1 h-1 rounded-full bg-indigo-500" />
              <div className="flex-1 h-1 rounded-full bg-white/10" />
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>
                    Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your full name"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    Email <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="you@example.com"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>
                  Company / Brand (optional)
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Acme Corp"
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>
                    Project Type <span className="text-indigo-400">*</span>
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectType: e.target.value,
                      })
                    }
                    className="w-full bg-[#161618] border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#161618] text-zinc-400">
                      Select a type...
                    </option>
                    <option value="Business Website" className="bg-[#161618] text-white">Business Website</option>
                    <option value="Portfolio Website" className="bg-[#161618] text-white">Portfolio Website</option>
                    <option value="Landing Page" className="bg-[#161618] text-white">Landing Page</option>
                    <option value="Dashboard / Admin Panel" className="bg-[#161618] text-white">
                      Dashboard / Admin Panel
                    </option>
                    <option value="Web App / MVP" className="bg-[#161618] text-white">Web App / MVP</option>
                    <option value="Website Redesign" className="bg-[#161618] text-white">Website Redesign</option>
                    <option value="Not Sure Yet" className="bg-[#161618] text-white">Not Sure Yet</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>
                    Budget Range <span className="text-indigo-400">*</span>
                  </label>
                  <select
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    className="w-full bg-[#161618] border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#161618] text-zinc-400">
                      Select a range...
                    </option>
                    <option value="Essential — ₹1,999" className="bg-[#161618] text-white">
                      Essential — ₹1,999
                    </option>
                    <option value="Professional — ₹4,999" className="bg-[#161618] text-white">
                      Professional — ₹4,999
                    </option>
                    <option value="Enterprise — ₹9,999" className="bg-[#161618] text-white">
                      Enterprise — ₹9,999
                    </option>
                    <option value="Custom — Let's discuss" className="bg-[#161618] text-white">
                      Custom — Let's discuss
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Timeline</label>
                <select
                  value={formData.timeline}
                  onChange={(e) =>
                    setFormData({ ...formData, timeline: e.target.value })
                  }
                  className="w-full bg-[#161618] border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="" disabled className="bg-[#161618] text-zinc-400">
                    Select timeline...
                  </option>
                  <option value="As soon as possible" className="bg-[#161618] text-white">
                    As soon as possible
                  </option>
                  <option value="Within 2 weeks" className="bg-[#161618] text-white">Within 2 weeks</option>
                  <option value="Within 1 month" className="bg-[#161618] text-white">Within 1 month</option>
                  <option value="Flexible / exploring options" className="bg-[#161618] text-white">
                    Flexible / exploring options
                  </option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>
                  Project Details <span className="text-indigo-400">*</span>
                </label>
                <textarea
                  value={formData.details}
                  onChange={(e) =>
                    setFormData({ ...formData, details: e.target.value })
                  }
                  rows={4}
                  placeholder="Tell us about your project goals, current challenges, and any specific requirements..."
                  className={`${inputClasses} resize-none`}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleFormSubmit}
                  variant="accent"
                  className="rounded-xl h-12 px-8 text-sm shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                >
                  Continue to Payment{" "}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "payment" && (
          <motion.div
            key="payment-step"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-[#111] border border-white/5 rounded-2xl p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => setStep("form")}
                className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Make Payment
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Step 2 of 2 — Pay via UPI and submit your UTR
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-8">
              <div className="flex-1 h-1 rounded-full bg-indigo-500" />
              <div className="flex-1 h-1 rounded-full bg-indigo-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Details */}
              <div className="space-y-6">
                {/* Amount Summary */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">
                    Amount to Pay
                  </p>
                  <p className="text-3xl font-black text-white">
                    {formData.budget.includes("₹")
                      ? formData.budget.split("—")[1]?.trim() || formData.budget
                      : "Custom"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    {formData.projectType} • {formData.budget.split("—")[0]?.trim()}
                  </p>
                </div>

                {/* UPI Details */}
                {paymentSettings ? (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                      Pay using UPI
                    </p>

                    {paymentSettings.upiId && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">UPI ID</p>
                          <p className="text-white font-bold text-lg">
                            {paymentSettings.upiId}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              paymentSettings.upiId,
                              "upiId"
                            )
                          }
                          className={`p-2.5 rounded-lg transition-all ${
                            copied === "upiId"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {copied === "upiId" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {paymentSettings.upiNumber && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">
                            UPI Number
                          </p>
                          <p className="text-white font-bold text-lg">
                            {paymentSettings.upiNumber}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              paymentSettings.upiNumber,
                              "upiNumber"
                            )
                          }
                          className={`p-2.5 rounded-lg transition-all ${
                            copied === "upiNumber"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {copied === "upiNumber" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                      <p className="text-amber-400 text-xs font-semibold mb-1">
                        How to pay
                      </p>
                      <ol className="text-zinc-400 text-xs space-y-1 list-decimal list-inside">
                        <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                        <li>Copy the UPI ID or Number above</li>
                        <li>Pay the exact amount shown</li>
                        <li>Copy the UTR/Transaction ID from payment receipt</li>
                        <li>Paste it below and submit</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center">
                    <Shield className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">
                      Payment details are being set up by the admin. Please
                      contact us directly.
                    </p>
                  </div>
                )}
              </div>

              {/* UTR Submission */}
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-4">
                    Submit Payment Proof
                  </p>
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-4">
                    <div>
                      <label className={labelClasses}>
                        UTR / Transaction Reference Number{" "}
                        <span className="text-indigo-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. 412345678901"
                        className={inputClasses}
                        maxLength={22}
                      />
                      <p className="text-xs text-zinc-600 mt-2">
                        You'll find this 12-digit number in your UPI payment
                        receipt
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">
                    Order Summary
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Project</span>
                      <span className="text-white font-medium">
                        {formData.projectType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Plan</span>
                      <span className="text-white font-medium">
                        {formData.budget.split("—")[0]?.trim()}
                      </span>
                    </div>
                    {formData.company && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Company</span>
                        <span className="text-white font-medium">
                          {formData.company}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Timeline</span>
                      <span className="text-white font-medium">
                        {formData.timeline || "Not specified"}
                      </span>
                    </div>
                    <div className="border-t border-white/5 pt-2 mt-2 flex justify-between">
                      <span className="text-zinc-400 font-semibold">
                        Total
                      </span>
                      <span className="text-white font-bold text-lg">
                        {formData.budget.includes("₹")
                          ? formData.budget.split("—")[1]?.trim()
                          : "Custom"}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleUtrSubmit}
                  variant="accent"
                  className="w-full rounded-xl h-12 text-sm shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  disabled={isSubmitting || !utrNumber.trim()}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      I've Paid — Submit UTR
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-8 sm:p-10 text-center"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Payment Submitted!
            </h3>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
              Your UTR has been received. Our team will verify the payment and
              activate your project shortly. You'll see the status update in
              your dashboard.
            </p>
            <Button
              onClick={resetForm}
              variant="outline"
              className="rounded-xl h-11 px-6 text-sm border-white/20"
            >
              Back to Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Active Projects",
            value: orders
              .filter(
                (o) =>
                  o.status !== "completed" && o.status !== "cancelled"
              )
              .length.toString(),
            icon: FolderKanban,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
          },
          {
            label: "Total Spent",
            value: `${orders.length > 0 ? orders[0]?.currency || "₹" : "₹"}${orders
              .reduce((a, o) => a + (o.price || 0), 0)
              .toLocaleString()}`,
            icon: CreditCard,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Awaiting Verification",
            value: orders
              .filter((o) => o.status === "awaiting_verification")
              .length.toString(),
            icon: Clock,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Completed",
            value: orders
              .filter((o) => o.status === "completed")
              .length.toString(),
            icon: TrendingUp,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition-colors"
          >
            <div
              className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-zinc-500 font-medium">
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          {...fadeUp}
          className="lg:col-span-2 bg-[#111] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-base font-bold text-white">Recent Orders</h2>
            {orders.length > 0 && (
              <button
                onClick={() => router.push("/dashboard/billing")}
                className="text-xs text-zinc-500 hover:text-white font-medium transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="divide-y divide-white/5">
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <FolderKanban className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium text-sm mb-1">
                  No orders yet
                </p>
                <p className="text-zinc-600 text-xs">
                  Your project orders will appear here.
                </p>
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="p-5 hover:bg-white/[0.02] transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <FolderKanban className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {order.planName}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {order.createdAt?.toDate?.()
                            ? new Intl.DateTimeFormat("en", {
                                dateStyle: "medium",
                              }).format(order.createdAt.toDate())
                            : "Recent"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-white">
                        {order.currency || "₹"}
                        {order.price?.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          order.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : order.status === "in_progress"
                            ? "bg-blue-500/10 text-blue-400"
                            : order.status === "awaiting_verification"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* UTR Status & Submission Bar */}
                  <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-white/5 gap-2">
                    {order.utrNumber ? (
                      <span className="text-indigo-400 font-mono flex items-center gap-1.5">
                        <Copy className="w-3 h-3" /> UTR Ref: {order.utrNumber}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 w-full justify-between">
                        <span className="text-amber-400 font-medium">
                          Payment UTR: Not Submitted
                        </span>
                        {submittingUtrForOrder !== order.id && (
                          <button
                            onClick={() => {
                              setSubmittingUtrForOrder(order.id);
                              setUserUtrInput("");
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline transition-colors"
                          >
                            + Submit UTR Number
                          </button>
                        )}
                      </div>
                    )}

                    {submittingUtrForOrder === order.id && (
                      <div className="w-full flex items-center gap-2 mt-2 p-2 bg-[#161618] border border-white/10 rounded-xl">
                        <input
                          type="text"
                          value={userUtrInput}
                          onChange={(e) => setUserUtrInput(e.target.value)}
                          placeholder="Enter your 12-digit UTR Number..."
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                        />
                        <Button
                          onClick={() => handleUserSubmitUtr(order.id)}
                          variant="accent"
                          size="sm"
                          className="rounded-lg h-8 px-3 text-xs"
                          disabled={!userUtrInput.trim()}
                        >
                          Submit UTR
                        </Button>
                        <button
                          onClick={() => setSubmittingUtrForOrder(null)}
                          className="text-xs text-zinc-500 hover:text-white px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Admin Query & User Response Section */}
                  {order.adminQuery && (
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                        <HelpCircle className="w-4 h-4" /> Action Required: Message from Admin
                      </div>
                      <p className="text-sm text-zinc-200 font-medium">
                        "{order.adminQuery}"
                      </p>

                      {order.userResponse ? (
                        <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Your Reply Submitted:
                            </span>
                            <button
                              onClick={() => {
                                setRespondingOrderId(order.id);
                                setResponseText(order.userResponse || "");
                              }}
                              className="text-zinc-500 hover:text-white transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-zinc-300 font-medium">{order.userResponse}</p>
                        </div>
                      ) : (
                        respondingOrderId !== order.id && (
                          <Button
                            onClick={() => {
                              setRespondingOrderId(order.id);
                              setResponseText("");
                            }}
                            variant="accent"
                            size="sm"
                            className="rounded-lg h-9 px-4 text-xs mt-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Reply to Admin Question
                          </Button>
                        )
                      )}

                      {/* Response Form */}
                      {respondingOrderId === order.id && (
                        <div className="space-y-3 pt-2">
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            rows={3}
                            placeholder="Type your reply to the admin..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setRespondingOrderId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                            <Button
                              onClick={() => handleRespondToQuery(order.id)}
                              variant="accent"
                              size="sm"
                              className="rounded-lg h-8 px-4 text-xs"
                              disabled={submittingResponse || !responseText.trim()}
                            >
                              {submittingResponse ? (
                                "Submitting..."
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  <Send className="w-3 h-3" /> Submit Reply
                                </span>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                    {/* Developer Interaction Room */}
                    <div className="pt-1">
                      <button
                        onClick={() =>
                          setOpenRoomOrderId(openRoomOrderId === order.id ? null : order.id)
                        }
                        className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          openRoomOrderId === order.id
                            ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                            : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {openRoomOrderId === order.id ? "Close" : "Open"} Developer Workspace
                      </button>
                      {openRoomOrderId === order.id && (
                        <DeveloperInteractionRoom
                          orderId={order.id}
                          orderStatus={order.status}
                          planName={order.planName}
                          currentUserId={user?.uid || ""}
                          currentUserName={user?.displayName || profile?.name || "Client"}
                          currentUserRole="user"
                        />
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          {...fadeUp}
          className="bg-[#111] border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-base font-bold text-white mb-5">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => setStep("form")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  Start a Project
                </p>
                <p className="text-xs text-zinc-500">
                  Describe your requirements & pay
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => router.push("/services")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  View Services
                </p>
                <p className="text-xs text-zinc-500">
                  See what we offer
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => router.push("/work")}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  View Portfolio
                </p>
                <p className="text-xs text-zinc-500">See our live projects</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Account info mini */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <h3 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">
              Account
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Name</span>
                <span className="text-white font-medium truncate ml-4">
                  {profile?.name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Phone</span>
                <span className="text-white font-medium">
                  {profile?.phone || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Location</span>
                <span className="text-white font-medium truncate ml-4">
                  {profile?.location || "—"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
