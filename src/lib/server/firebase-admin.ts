import { getApps, initializeApp, cert, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;

if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      console.warn("Firebase Admin SDK credentials not fully configured in environment.");
    }
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
} else {
  adminApp = getApp();
}

export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;

