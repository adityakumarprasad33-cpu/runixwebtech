"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface AdminPermissions {
  payments: boolean;       // Can verify/approve/reject payments
  notifications: boolean;  // Can send notifications
  queries: boolean;        // Can send queries to users
  cms: boolean;            // Can manage CMS (projects, hero stats, payment settings)
  offers: boolean;         // Can manage promotional offers & deals
  logs: boolean;           // Can view security & activity logs
  financials: boolean;     // Can view & manage P&L, accounts, and financial ledger
  salaries: boolean;       // Can view & disburse staff salaries & developer revenue shares
}

export interface PayoutDetails {
  type: "upi" | "bank";
  upiId?: string;
  upiName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
}

export interface SalaryConfig {
  type: "percentage" | "fixed_monthly" | "hybrid";
  percentage?: number; // e.g. 40 for 40%
  fixedAmount?: number; // e.g. 25000 for ₹25,000/mo
  currency?: string;
  designationTitle?: string;
  retainerPercentage?: number; // e.g. 50 for 50%
}

export interface UserProfile {
  role?: "super_admin" | "admin" | "developer" | "user" | string;
  name?: string;
  email?: string;
  adminPermissions?: AdminPermissions;
  payoutDetails?: PayoutDetails;
  salaryConfig?: SalaryConfig;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  canDo: (permission: keyof AdminPermissions) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
  isDeveloper: false,
  canDo: () => false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubscribeAuth: (() => void) | undefined;

    const initAuth = () => {
      unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          if (unsubProfile) unsubProfile();
          unsubProfile = onSnapshot(
            doc(db, "users", currentUser.uid),
            (docSnap) => {
              if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
              } else {
                setProfile(null);
              }
              setLoading(false);
            },
            (err) => {
              console.warn("User profile listener notice:", err?.message || err);
              setLoading(false);
            }
          );
        } else {
          if (unsubProfile) {
            unsubProfile();
            unsubProfile = undefined;
          }
          setProfile(null);
          setLoading(false);
        }
      });
    };

    // Requirement 13 & 25: Defer non-critical auth scripts on marketing pages to protect hero LCP
    if (typeof window !== "undefined") {
      const isCriticalAuthRoute =
        window.location.pathname.startsWith("/dashboard") ||
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/signup") ||
        window.location.pathname.startsWith("/forgot-password") ||
        window.location.pathname.startsWith("/reset-password");

      const hasExistingSession =
        document.cookie.includes("__session") ||
        Object.keys(localStorage).some((k) => k.startsWith("firebase:authUser"));

      if (isCriticalAuthRoute || hasExistingSession) {
        initAuth();
        return () => {
          if (unsubscribeAuth) unsubscribeAuth();
          if (unsubProfile) unsubProfile();
        };
      }

      // For anonymous first-time visitors on marketing pages, initialize on user interaction or idle (9s)
      const events = ["pointerdown", "touchstart", "keydown", "scroll"];
      const onUserActivity = () => {
        events.forEach((ev) => window.removeEventListener(ev, onUserActivity));
        initAuth();
      };
      events.forEach((ev) =>
        window.addEventListener(ev, onUserActivity, { once: true, passive: true })
      );

      const timer = setTimeout(onUserActivity, 9000);
      return () => {
        clearTimeout(timer);
        events.forEach((ev) => window.removeEventListener(ev, onUserActivity));
        if (unsubscribeAuth) unsubscribeAuth();
        if (unsubProfile) unsubProfile();
      };
    }
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const isSuperAdmin = profile?.role === "super_admin";
  const isAdmin = profile?.role === "admin" || isSuperAdmin;
  const isDeveloper = profile?.role === "developer";

  /** super_admin bypasses all permission checks; regular admin checks their specific flag */
  const canDo = (permission: keyof AdminPermissions): boolean => {
    if (isSuperAdmin) return true;
    return profile?.adminPermissions?.[permission] === true;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSuperAdmin, isAdmin, isDeveloper, canDo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
