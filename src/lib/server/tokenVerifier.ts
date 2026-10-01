import crypto from "crypto";

export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  [key: string]: any;
}

let cachedCerts: Record<string, string> | null = null;
let certsExpiry = 0;

/**
 * Fetches Google's public x509 certificates used to sign Firebase ID tokens.
 * Automatically caches certificates according to the HTTP Cache-Control max-age header.
 */
async function getGooglePublicCerts(forceRefresh = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && cachedCerts && now < certsExpiry) {
    return cachedCerts;
  }

  try {
    const res = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      {
        headers: {
          "Accept": "application/json",
        },
        // Cache in Next.js fetch cache where applicable
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch Google public certs: HTTP ${res.status}`);
    }

    const cacheControl = res.headers.get("cache-control") || "";
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

    cachedCerts = (await res.json()) as Record<string, string>;
    certsExpiry = now + maxAgeSec * 1000;
    return cachedCerts;
  } catch (err: any) {
    // If refresh failed but we have stale certs, return stale certs rather than failing outright
    if (cachedCerts && Object.keys(cachedCerts).length > 0) {
      console.warn("Using stale Google certs after refresh error:", err?.message || err);
      return cachedCerts;
    }
    throw err;
  }
}

/**
 * Pure Node.js verification of Firebase Auth ID Tokens.
 * Uses native crypto to verify RS256 signature against Google's public certificates.
 * Works seamlessly in all serverless environments without requiring firebase-admin/auth or jose.
 */
export async function verifyFirebaseIdToken(
  token: string,
  expectedProjectId?: string
): Promise<DecodedFirebaseToken> {
  if (!token || typeof token !== "string") {
    throw new Error("Missing or empty token");
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT token format. Token must have 3 segments.");
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // 1. Decode header
  let header: { alg?: string; kid?: string; typ?: string };
  try {
    header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf-8"));
  } catch {
    throw new Error("Failed to decode token header");
  }

  if (header.alg !== "RS256") {
    throw new Error(`Invalid token algorithm: ${header.alg}. Expected RS256.`);
  }

  if (!header.kid) {
    throw new Error("Token header missing 'kid' claim.");
  }

  // 2. Decode payload
  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
  } catch {
    throw new Error("Failed to decode token payload");
  }

  // 3. Find certificate for kid
  let certs = await getGooglePublicCerts();
  let cert = certs[header.kid];

  // If kid not found in cached certs, force a fresh fetch in case Google recently rotated keys
  if (!cert) {
    certs = await getGooglePublicCerts(true);
    cert = certs[header.kid];
  }

  if (!cert) {
    throw new Error(`Google certificate not found for kid: ${header.kid}`);
  }

  // 4. Verify RS256 signature using Node's native crypto
  const signedData = `${headerB64}.${payloadB64}`;
  const signatureBuffer = Buffer.from(signatureB64, "base64url");

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(signedData);
  const isValid = verifier.verify(cert, signatureBuffer);

  if (!isValid) {
    throw new Error("Invalid token signature");
  }

  // 5. Validate standard Firebase ID token claims
  const nowSec = Math.floor(Date.now() / 1000);
  const clockSkewSec = 300; // Allow up to 5 minutes clock skew

  if (typeof payload.exp !== "number" || payload.exp < nowSec - clockSkewSec) {
    throw new Error(`Token has expired at ${new Date(payload.exp * 1000).toISOString()}`);
  }

  if (typeof payload.iat !== "number" || payload.iat > nowSec + clockSkewSec) {
    throw new Error("Token issued in the future");
  }

  const projectId =
    expectedProjectId ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "portfolio-1fb93";

  if (payload.aud !== projectId) {
    // Also accept matching if audience matches project ID stripped of quotes
    const cleanAud = (payload.aud || "").replace(/['"]/g, "");
    const cleanProj = projectId.replace(/['"]/g, "");
    if (cleanAud !== cleanProj) {
      throw new Error(`Token audience '${payload.aud}' does not match project ID '${projectId}'`);
    }
  }

  const expectedIssuer = `https://securetoken.google.com/${projectId.replace(/['"]/g, "")}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error(`Token issuer '${payload.iss}' does not match expected issuer '${expectedIssuer}'`);
  }

  const uid = payload.user_id || payload.sub;
  if (!uid || typeof uid !== "string") {
    throw new Error("Token missing valid subject (sub / user_id)");
  }

  return {
    ...payload,
    uid,
    user_id: uid,
    sub: uid,
  };
}
