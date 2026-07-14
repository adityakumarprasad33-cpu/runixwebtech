"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { User, Mail, Phone, MapPin, Save, CheckCircle2 } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ name: "", email: "", phone: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile({
          name: user.displayName || "",
          email: user.email || "",
          phone: "",
          location: "",
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
      });
      await updateProfile(user, { displayName: profile.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-white/10 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white font-jakarta tracking-tight">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account details and preferences.</p>
      </div>

      {/* Profile Form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-white/5 rounded-2xl p-6 sm:p-8">
        <h2 className="text-base font-bold text-white mb-6">Profile Information</h2>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-zinc-600 mt-1.5">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
          <Button onClick={handleSave} variant="accent" className="rounded-xl h-11 px-8 text-sm" disabled={saving}>
            {saving ? (
              "Saving..."
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </span>
            )}
          </Button>
          {saved && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <div className="bg-[#111] border border-red-500/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-base font-bold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-zinc-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <Button variant="outline" className="rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 h-10 px-6 text-sm">
          Delete Account
        </Button>
      </div>
    </div>
  );
}
