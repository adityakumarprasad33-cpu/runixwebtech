import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let _authInstance: Auth | null = null;
let _dbInstance: Firestore | null = null;

/**
 * Lazy getters (Requirement 13 & 17):
 * Ensures getAuth() is never called at module evaluation time, preventing
 * third-party apis.google.com scripts / iframes from blocking hero rendering
 * on public marketing routes.
 */
export const getFirebaseAuth = (): Auth => {
  if (!_authInstance) {
    _authInstance = getAuth(app);
  }
  return _authInstance;
};

export const getFirebaseDb = (): Firestore => {
  if (!_dbInstance) {
    _dbInstance = getFirestore(app);
  }
  return _dbInstance;
};

// Lazy Proxies for standard import { auth, db } compatibility
export const auth = new Proxy({} as Auth, {
  get(_, prop) {
    const target = getFirebaseAuth();
    const val = (target as any)[prop];
    return typeof val === "function" ? val.bind(target) : val;
  },
});

export const db = new Proxy({} as Firestore, {
  get(_, prop) {
    const target = getFirebaseDb();
    const val = (target as any)[prop];
    return typeof val === "function" ? val.bind(target) : val;
  },
});

export { app };
