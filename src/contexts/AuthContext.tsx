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
  logs: boolean;           // Can view security & activity logs
}

export interface UserProfile {
  role?: "super_admin" | "admin" | "user" | string;
  name?: string;
  email?: string;
  adminPermissions?: AdminPermissions;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  canDo: (permission: keyof AdminPermissions) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
  canDo: () => false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        if (unsubProfile) unsubProfile();
        unsubProfile = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        });
      } else {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = undefined;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const isSuperAdmin = profile?.role === "super_admin";
  const isAdmin = profile?.role === "admin" || isSuperAdmin;

  /** super_admin bypasses all permission checks; regular admin checks their specific flag */
  const canDo = (permission: keyof AdminPermissions): boolean => {
    if (isSuperAdmin) return true;
    return profile?.adminPermissions?.[permission] === true;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSuperAdmin, isAdmin, canDo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
