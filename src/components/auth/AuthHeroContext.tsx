"use client";

import { createContext, useContext, useState, useRef, ReactNode } from "react";

export type AuthHeroState = "idle" | "email-focus" | "password-focus" | "authenticating" | "error" | "success";

export type Hero3DAuthHandle = {
  playSuccessSequence: () => Promise<void>;
};

interface AuthHeroContextType {
  heroState: AuthHeroState;
  updateHeroState: (state: AuthHeroState) => void;
  heroHandleRef: React.MutableRefObject<Hero3DAuthHandle | null>;
}

const AuthHeroContext = createContext<AuthHeroContextType | undefined>(undefined);

export function AuthHeroProvider({ children }: { children: ReactNode }) {
  const [heroState, setHeroState] = useState<AuthHeroState>("idle");
  const heroHandleRef = useRef<Hero3DAuthHandle | null>(null);

  const updateHeroState = (state: AuthHeroState) => {
    setHeroState(state);
  };

  return (
    <AuthHeroContext.Provider value={{ heroState, updateHeroState, heroHandleRef }}>
      {children}
    </AuthHeroContext.Provider>
  );
}

export function useAuthHero() {
  const context = useContext(AuthHeroContext);
  if (!context) {
    throw new Error("useAuthHero must be used within an AuthHeroProvider");
  }
  return context;
}
