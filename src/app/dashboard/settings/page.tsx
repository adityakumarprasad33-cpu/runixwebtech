"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  CreditCard,
  Building2,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { safeFetchJson } from "@/lib/safeFetch";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  payoutDetails?: {
    type: "upi" | "bank";
    upiId?: string;
    upiName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
}

export default function SettingsPage() {
  const { user, isDeveloper, isAdmin, isSuperAdmin } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ name: "", email: "", phone: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Payout State
  const [payoutType, setPayoutType] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);
  const [savedPayout, setSavedPayout] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const docRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);

          if (data.payoutDetails) {
            setPayoutType(data.payoutDetails.type || "upi");
            setUpiId(data.payoutDetails.upiId || "");
            setUpiName(data.payoutDetails.upiName || "");
            setBankName(data.payoutDetails.bankName || "");
            setAccountNumber(data.payoutDetails.accountNumber || "");
            setIfscCode(data.payoutDetails.ifscCode || "");
            setAccountHolderName(data.payoutDetails.accountHolderName || "");
          }
        } else {
          setProfile({
            name: user.displayName || "",
            email: user.email || "",
            phone: "",
            location: "",
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Realtime settings error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayoutDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingPayout(true);

    const payoutPayload = {
      type: payoutType,
      upiId: upiId.trim(),
      upiName: upiName.trim() || profile.name,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      accountHolderName: accountHolderName.trim() || profile.name,
    };

    try {
      const token = await user.getIdToken();
      const res = await safeFetchJson<any>("/api/user/payout-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payoutPayload),
      });

      if (!res.ok || !res.data?.success) {
        // Fallback to client Firestore
        await updateDoc(doc(db, "users", user.uid), {
          payoutDetails: payoutPayload,
          updatedAt: new Date().toISOString(),
        });
      }

      setSavedPayout(true);
      setTimeout(() => setSavedPayout(false), 3000);
    } catch (err: any) {
      console.error("Failed to save payout settings:", err);
      try {
        await updateDoc(doc(db, "users", user.uid), {
          payoutDetails: payoutPayload,
          updatedAt: new Date().toISOString(),
        });
        setSavedPayout(true);
        setTimeout(() => setSavedPayout(false), 3000);
      } catch (fallbackErr: any) {
        alert(fallbackErr.message || "Failed to update payout details");
      }
    } finally {
      setSavingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-[rgba(21,24,29,0.10)] border-t-[#315EF7] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#111317]  tracking-tight">Account & Payout Settings</h1>
        <p className="text-[#4B5563] text-sm mt-1">
          Manage your personal details and configure your preferred UPI or Bank disbursement channels.
        </p>
      </div>

      {/* Profile Form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[rgba(21,24,29,0.10)] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_12px_40px_rgba(21,24,29,0.06)]">
        <h2 className="text-base font-bold text-[#111317] flex items-center gap-2">
          <User className="w-4 h-4 text-[#315EF7]" /> Profile Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name */}
          <div>
            <label className="text-xs text-[#4B5563] font-semibold uppercase tracking-wider mb-2 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl pl-11 pr-4 py-2.5 text-sm text-[#111317] focus:outline-none focus:border-[#315EF7] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="text-xs text-[#4B5563] font-semibold uppercase tracking-wider mb-2 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full bg-[#E5E7EB] border border-[rgba(21,24,29,0.10)] rounded-xl pl-11 pr-4 py-2.5 text-sm text-[#6B7280] cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs text-[#4B5563] font-semibold uppercase tracking-wider mb-2 block">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl pl-11 pr-4 py-2.5 text-sm text-[#111317] focus:outline-none focus:border-[#315EF7] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-[#4B5563] font-semibold uppercase tracking-wider mb-2 block">Location / City</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl pl-11 pr-4 py-2.5 text-sm text-[#111317] focus:outline-none focus:border-[#315EF7] focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Save Profile Button */}
        <div className="flex items-center gap-4 pt-4 border-t border-[rgba(21,24,29,0.08)]">
          <Button onClick={handleSaveProfile} variant="accent" className="rounded-xl h-10 px-6 text-xs" disabled={saving}>
            {saving ? (
              "Saving..."
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Profile Details
              </span>
            )}
          </Button>
          {saved && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-[#169B62] text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* Payout & Banking Configuration (Visible to Developers, Admins & Staff) */}
      {(isDeveloper || isAdmin || isSuperAdmin) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[rgba(21,24,29,0.10)] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_12px_40px_rgba(21,24,29,0.06)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#111317] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#169B62]" /> Payout & Banking Disbursement Channel
              </h2>
              <p className="text-xs text-[#4B5563] mt-1">
                Configure your payment details to receive your <strong className="text-[#169B62]">40% Sprint Revenue Shares</strong> and SLA Retainers directly to your UPI or Bank.
              </p>
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#169B62]/10 text-[#169B62] border border-[#169B62]/20 px-2.5 py-1 rounded-full w-fit">
              40% Project Payout Active
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setPayoutType("upi")}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                payoutType === "upi"
                  ? "bg-[#315EF7]/10 text-[#315EF7] border-[#315EF7]/30 shadow-xs"
                  : "bg-[#FAFAFA] text-[#4B5563] border-[rgba(21,24,29,0.10)] hover:text-[#111317]"
              }`}
            >
              <QrCode className="w-4 h-4 text-[#315EF7]" /> Direct UPI (GPay / PhonePe / Paytm)
            </button>
            <button
              type="button"
              onClick={() => setPayoutType("bank")}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                payoutType === "bank"
                  ? "bg-[#315EF7]/10 text-[#315EF7] border-[#315EF7]/30 shadow-xs"
                  : "bg-[#FAFAFA] text-[#4B5563] border-[rgba(21,24,29,0.10)] hover:text-[#111317]"
              }`}
            >
              <Building2 className="w-4 h-4 text-[#169B62]" /> Bank Transfer (NEFT / IMPS)
            </button>
          </div>

          <form onSubmit={handleSavePayoutDetails} className="space-y-4">
            {payoutType === "upi" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#4B5563] font-semibold mb-1 block">
                    UPI VPA ID <span className="text-[#315EF7]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. aditya@okhdfcbank or 9876543210@paytm"
                    className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl px-4 py-2.5 text-xs text-[#111317] focus:outline-none focus:border-[#315EF7] focus:bg-white font-mono"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1">Instant disbursements are sent directly to this UPI address.</p>
                </div>

                <div>
                  <label className="text-xs text-[#4B5563] font-semibold mb-1 block">
                    Verified Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                    placeholder="Name registered with bank/UPI"
                    className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl px-4 py-2.5 text-xs text-[#111317] focus:outline-none focus:border-[#315EF7] focus:bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#4B5563] font-semibold mb-1 block">
                    Account Holder Full Name <span className="text-[#315EF7]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="As listed on bank passbook"
                    className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl px-4 py-2.5 text-xs text-[#111317] focus:outline-none focus:border-[#315EF7] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#4B5563] font-semibold mb-1 block">
                    Bank Name <span className="text-[#315EF7]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank / State Bank of India"
                    className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl px-4 py-2.5 text-xs text-[#111317] focus:outline-none focus:border-[#315EF7] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#4B5563] font-semibold mb-1 block">
                    Bank Account Number <span className="text-[#315EF7]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter Account Number"
                    className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl px-4 py-2.5 text-xs text-[#111317] focus:outline-none focus:border-[#315EF7] focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#4B5563] font-semibold mb-1 block">
                    IFSC Code <span className="text-[#315EF7]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full bg-[#FAFAFA] border border-[rgba(21,24,29,0.12)] rounded-xl px-4 py-2.5 text-xs text-[#111317] focus:outline-none focus:border-[#315EF7] focus:bg-white font-mono uppercase"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-3">
              <Button type="submit" variant="accent" className="rounded-xl h-10 px-6 text-xs bg-[#169B62] hover:bg-[#128050] text-white font-bold" disabled={savingPayout}>
                {savingPayout ? (
                  "Saving..."
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Save Payout Details
                  </span>
                )}
              </Button>
              {savedPayout && (
                <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-[#169B62] text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Payout channel updated!
                </motion.span>
              )}
            </div>
          </form>
        </motion.div>
      )}

      {/* Danger Zone */}
      <div className="bg-white border border-[#D83A3A]/20 rounded-xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(21,24,29,0.04)]">
        <h2 className="text-base font-bold text-[#D83A3A] mb-2">Danger Zone</h2>
        <p className="text-xs text-[#4B5563] mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <Button variant="outline" className="rounded-xl border-[#D83A3A]/30 text-[#D83A3A] hover:bg-[#D83A3A]/10 h-9 px-5 text-xs">
          Delete Account
        </Button>
      </div>
    </div>
  );
}
