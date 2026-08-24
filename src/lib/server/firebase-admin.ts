import { getApps, initializeApp, cert, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;

function sanitizePrivateKey(rawKey?: string): string | undefined {
  if (!rawKey) return undefined;
  let key = rawKey.trim();
  // Strip surrounding quotes
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  // Replace escaped \n with actual newlines
  key = key.replace(/\\n/g, "\n");
  return key;
}

function initAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = sanitizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (projectId && clientEmail && privateKey) {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "Firebase Admin SDK: Incomplete credentials in environment (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)."
        );
      }
      return null;
    }
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
    return null;
  }
}

adminApp = initAdminApp();

export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;

export function getAdminDb(): Firestore | null {
  if (adminDb) return adminDb;
  const app = initAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminAuth(): Auth | null {
  if (adminAuth) return adminAuth;
  const app = initAdminApp();
  return app ? getAuth(app) : null;
}
