import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/server/firebase-admin";
import { verifyFirebaseIdToken } from "@/lib/server/tokenVerifier";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PayoutDetailsSchema = z.object({
  type: z.enum(["upi", "bank"]),
  upiId: z.string().max(100).optional().or(z.literal("")),
  upiName: z.string().max(100).optional().or(z.literal("")),
  bankName: z.string().max(100).optional().or(z.literal("")),
  accountNumber: z.string().max(40).optional().or(z.literal("")),
  ifscCode: z.string().max(20).optional().or(z.literal("")),
  accountHolderName: z.string().max(100).optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized: Missing auth token." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1].trim();
    let uid = "";
    try {
      const decoded = await verifyFirebaseIdToken(token);
      uid = decoded.uid;
    } catch {
      const auth = await getAdminAuth().catch(() => null);
      if (auth) {
        const decoded = await auth.verifyIdToken(token);
        uid = decoded.uid;
      } else {
        return NextResponse.json({ success: false, error: "Unauthorized: Invalid or expired token." }, { status: 401 });
      }
    }

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const data = userDoc.data();
    return NextResponse.json({
      success: true,
      payoutDetails: data?.payoutDetails || null,
    });
  } catch (error: any) {
    console.error("Fetch payout settings error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch payout settings." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized: Missing auth token." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1].trim();
    let uid = "";
    try {
      const decoded = await verifyFirebaseIdToken(token);
      uid = decoded.uid;
    } catch {
      const auth = await getAdminAuth().catch(() => null);
      if (auth) {
        const decoded = await auth.verifyIdToken(token);
        uid = decoded.uid;
      } else {
        return NextResponse.json({ success: false, error: "Unauthorized: Invalid or expired token." }, { status: 401 });
      }
    }

    const body = await req.json();
    const parseResult = PayoutDetailsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payout parameters.", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const payoutDetails = parseResult.data;

    // Validate type specific rules
    if (payoutDetails.type === "upi" && !payoutDetails.upiId?.trim()) {
      return NextResponse.json({ success: false, error: "Please enter a valid UPI VPA ID." }, { status: 400 });
    }

    if (payoutDetails.type === "bank" && (!payoutDetails.accountNumber?.trim() || !payoutDetails.ifscCode?.trim())) {
      return NextResponse.json({ success: false, error: "Please enter Account Number and IFSC Code." }, { status: 400 });
    }

    await db.collection("users").doc(uid).set(
      {
        payoutDetails,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "Payout and banking details updated successfully.",
      payoutDetails,
    });
  } catch (error: any) {
    console.error("Save payout settings error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to save payout settings." }, { status: 500 });
  }
}
