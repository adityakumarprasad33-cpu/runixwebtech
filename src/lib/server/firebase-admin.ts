import { getApps, initializeApp, cert, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;

function sanitizePrivateKey(rawKey?: string): string | undefined {
  if (!rawKey) return undefined;
  let key = rawKey.trim();

  // If it's a base64 encoded private key or JSON
  if (!key.includes("-----BEGIN") && key.length > 200) {
    try {
      const decoded = Buffer.from(key, "base64").toString("utf-8");
      if (decoded.includes("-----BEGIN PRIVATE KEY-----") || decoded.includes("{")) {
        key = decoded.trim();
      }
    } catch {}
  }

  // If the key is a full service account JSON string
  if (key.startsWith("{") && key.endsWith("}")) {
    try {
      const parsed = JSON.parse(key);
      if (parsed.private_key) {
        return sanitizePrivateKey(parsed.private_key);
      }
    } catch {}
  }

  // Strip surrounding quotes
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  // Replace escaped \n with actual newlines and remove \r
  key = key.replace(/\\r/g, "").replace(/\\n/g, "\n");

  return key;
}

function initAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    // Check if full service account JSON is provided
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_CONFIG_ADMIN;
    if (serviceAccountJson) {
      try {
        const parsed = JSON.parse(serviceAccountJson.trim());
        return initializeApp({
          credential: cert(parsed),
        });
      } catch (err) {
        console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", err);
      }
    }

    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      "runix-webtech";
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
          "Firebase Admin SDK: Missing or incomplete environment credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)."
        );
      }
      return null;
    }
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
    return null;
  }
}

export function getAdminApp(): App | null {
  if (!adminApp && getApps().length === 0) {
    adminApp = initAdminApp();
  } else if (getApps().length > 0) {
    adminApp = getApp();
  }
  return adminApp;
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

// Proxied exports so direct usage of `adminDb.collection(...)` dynamically resolves
export const adminDb: Firestore | null = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    if (!db) return undefined;
    const val = (db as any)[prop];
    if (typeof val === "function") {
      return val.bind(db);
    }
    return val;
  },
});

export const adminAuth: Auth | null = new Proxy({} as Auth, {
  get(_target, prop) {
    const auth = getAdminAuth();
    if (!auth) return undefined;
    const val = (auth as any)[prop];
    if (typeof val === "function") {
      return val.bind(auth);
    }
    return val;
  },
});
