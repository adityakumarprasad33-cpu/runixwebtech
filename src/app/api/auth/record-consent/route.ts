import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/server/firebase-admin";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { CURRENT_TERMS_VERSION, validateTermsConsent } from "@/lib/terms";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getTrustedClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing authentication token." },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1]?.trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token format." },
        { status: 401 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { success: false, error: "Authentication service temporarily unavailable." },
        { status: 503 }
      );
    }

    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email || "";

    const body = await req.json().catch(() => ({}));
    const { termsAccepted, termsVersion, signupMethod, name, phone, location } = body;

    // Server-side Terms validation
    const validation = validateTermsConsent({ termsAccepted, termsVersion });
    if (!validation.valid) {
      await logSecurityEvent({
        action: "auth:consent_rejected",
        actorEmail: email,
        status: "denied",
        ip,
        reason: validation.error,
        metadata: { termsVersion, signupMethod },
      });

      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Atomic update/create in Firestore
    const userRef = adminDb.collection("users").doc(uid);
    await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(userRef);
      const existing = snap.data() || {};

      const updateData: Record<string, any> = {
        uid,
        email: email || existing.email || "",
        name: name || existing.name || decodedToken.name || "Runix User",
        role: existing.role || "user",
        termsAccepted: true,
        termsVersion: CURRENT_TERMS_VERSION,
        termsAcceptedAt: FieldValue.serverTimestamp(),
        signupMethod: signupMethod || "password_signup",
        lastConsentIp: ip,
        lastConsentUserAgent: userAgent.slice(0, 200),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!snap.exists) {
        updateData.createdAt = FieldValue.serverTimestamp();
      }

      if (phone) updateData.phone = phone;
      if (location) updateData.location = location;
      if (decodedToken.picture && !existing.photoURL) {
        updateData.photoURL = decodedToken.picture;
      }

      transaction.set(userRef, updateData, { merge: true });
    });

    await logSecurityEvent({
      action: "auth:terms_accepted",
      actorEmail: email,
      status: "success",
      ip,
      metadata: {
        termsVersion: CURRENT_TERMS_VERSION,
        signupMethod: signupMethod || "password_signup",
      },
    });

    return NextResponse.json({
      success: true,
      termsVersion: CURRENT_TERMS_VERSION,
      uid,
    });
  } catch (error: any) {
    console.error("Consent recording server error:", error);
    await logSecurityEvent({
      action: "auth:consent_error",
      status: "failed",
      ip,
      reason: error?.message || "Internal error",
    });

    return NextResponse.json(
      { success: false, error: "Failed to record terms consent. Please try again." },
      { status: 500 }
    );
  }
}
