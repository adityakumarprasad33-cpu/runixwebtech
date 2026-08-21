import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import PaytmChecksum from "@/lib/paytmChecksum";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    if (!adminDb) {
      return NextResponse.redirect(new URL("/dashboard?payment_status=error&msg=database_unavailable", req.url));
    }

    const contentType = req.headers.get("content-type") || "";
    let paytmParams: Record<string, any> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        paytmParams[key] = value.toString();
      });
    } else if (contentType.includes("application/json")) {
      paytmParams = await req.json();
    }

    // 1. Simulation Guard (Strictly prohibited in production)
    const isSimulated = paytmParams.simulated === true || paytmParams.simulated === "true";
    if (process.env.NODE_ENV === "production" && isSimulated) {
      await logSecurityEvent({
        action: "paytm:callback_simulation_rejected",
        status: "denied",
        ip: clientIp,
        reason: "Simulated payment callback attempted in production environment.",
      });
      return NextResponse.json({ success: false, error: "Simulation rejected in production." }, { status: 403 });
    }

    // 2. Checksum Signature Verification
    const mkey = process.env.PAYTM_MERCHANT_KEY;
    const checksum = paytmParams.CHECKSUMHASH;

    if (!isSimulated) {
      if (!mkey || !checksum) {
        await logSecurityEvent({
          action: "paytm:callback_missing_checksum",
          status: "denied",
          ip: clientIp,
          reason: "Missing Paytm merchant key or checksum hash.",
        });
        return NextResponse.redirect(new URL("/dashboard?payment_status=invalid_signature", req.url));
      }

      const isValidSignature = PaytmChecksum.verifySignature(paytmParams, mkey, checksum);
      if (!isValidSignature) {
        await logSecurityEvent({
          action: "paytm:callback_signature_failed",
          status: "denied",
          ip: clientIp,
          reason: "Cryptographic SHA256 checksum verification failed.",
        });
        return NextResponse.redirect(new URL("/dashboard?payment_status=invalid_signature", req.url));
      }
    }

    // 3. Merchant ID Verification
    const configuredMid = process.env.PAYTM_MID;
    if (configuredMid && paytmParams.MID && paytmParams.MID !== configuredMid) {
      await logSecurityEvent({
        action: "paytm:callback_mid_mismatch",
        status: "denied",
        ip: clientIp,
        reason: `MID mismatch: received ${paytmParams.MID}, expected ${configuredMid}`,
      });
      return NextResponse.redirect(new URL("/dashboard?payment_status=invalid_merchant", req.url));
    }

    // 4. Server-Authoritative Order & Milestone Resolution (Zero URL param trust)
    const rawOrderIdParam: string = paytmParams.ORDERID || "";
    if (!rawOrderIdParam) {
      return NextResponse.redirect(new URL("/dashboard?payment_status=error&msg=missing_order", req.url));
    }

    // Standardized Order ID parsing: e.g. RUNIX_ORD_<orderId>_<milestone>_<nonce> or <orderId>_<milestone>
    let internalOrderId = rawOrderIdParam;
    let expectedMilestone: "advance" | "final" | "maintenance" = "advance";

    if (rawOrderIdParam.includes("_FINAL_") || rawOrderIdParam.endsWith("_final")) {
      expectedMilestone = "final";
      internalOrderId = rawOrderIdParam.replace(/^RUNIX_ORD_/, "").split("_FINAL_")[0].split("_final")[0];
    } else if (rawOrderIdParam.includes("_MAINT_") || rawOrderIdParam.endsWith("_maint")) {
      expectedMilestone = "maintenance";
      internalOrderId = rawOrderIdParam.replace(/^RUNIX_ORD_/, "").split("_MAINT_")[0].split("_maint")[0];
    } else if (rawOrderIdParam.includes("_ADV_") || rawOrderIdParam.endsWith("_adv")) {
      expectedMilestone = "advance";
      internalOrderId = rawOrderIdParam.replace(/^RUNIX_ORD_/, "").split("_ADV_")[0].split("_adv")[0];
    } else if (rawOrderIdParam.includes("_")) {
      internalOrderId = rawOrderIdParam.split("_")[0];
    }

    const isSuccess =
      paytmParams.STATUS === "TXN_SUCCESS" ||
      paytmParams.RESPCODE === "01" ||
      isSimulated;

    const txnId = paytmParams.TXNID || `SIM_TXN_${Date.now()}`;
    const idempotencyKey = `paytm_${txnId}_${expectedMilestone}`;

    if (!isSuccess) {
      await logSecurityEvent({
        action: "paytm:payment_failed",
        resourceId: internalOrderId,
        status: "failed",
        ip: clientIp,
        metadata: { status: paytmParams.STATUS, respCode: paytmParams.RESPCODE, respMsg: paytmParams.RESPMSG },
      });
      return NextResponse.redirect(
        new URL(`/dashboard?payment_status=failed&orderId=${internalOrderId}&msg=${encodeURIComponent(paytmParams.RESPMSG || "Payment failed")}`, req.url)
      );
    }

    // 5. Atomic Transaction: Idempotency Check, Amount Validation, State Machine Transition & Developer Assignment
    const orderRef = adminDb.collection("orders").doc(internalOrderId);
    const eventRef = adminDb.collection("payment_events").doc(idempotencyKey);

    const transactionResult = await adminDb.runTransaction(async (transaction) => {
      // a. Check Idempotency Ledger
      const eventSnap = await transaction.get(eventRef);
      if (eventSnap.exists) {
        return { isDuplicate: true };
      }

      // b. Load Internal Order Record
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        throw new Error(`Order "${internalOrderId}" not found in database.`);
      }

      const orderData = orderSnap.data() || {};

      // c. Authoritative Amount Validation
      let expectedAmount = 0;
      if (expectedMilestone === "advance") {
        expectedAmount = orderData.advancePrice || Math.round((orderData.totalPrice || 0) * 0.5);
      } else if (expectedMilestone === "final") {
        expectedAmount = orderData.finalPrice || Math.round((orderData.totalPrice || 0) * 0.5);
      } else if (expectedMilestone === "maintenance") {
        expectedAmount = orderData.maintenanceAmount || 2999;
      }

      const receivedAmount = parseFloat(paytmParams.TXNAMOUNT || "0");
      if (!isSimulated && Math.abs(receivedAmount - expectedAmount) > 1.0) {
        throw new Error(`Payment amount mismatch: Received ₹${receivedAmount}, Expected ₹${expectedAmount}`);
      }

      // d. State Machine Transition
      const nowIso = new Date().toISOString();
      const updatePayload: Record<string, any> = {
        updatedAt: nowIso,
      };

      let assignedDevData: any = null;

      if (expectedMilestone === "advance") {
        updatePayload.advancePaid = true;
        updatePayload.advancePaymentId = txnId;
        updatePayload.advancePaidAt = nowIso;
        updatePayload.paymentMethod = "paytm_gateway";

        if (orderData.status === "awaiting_advance" || !orderData.status) {
          updatePayload.status = "in_progress";
        }

        // e. Atomic Developer Auto-Assignment
        if (!orderData.assignedDeveloperId) {
          const devsSnap = await adminDb!.collection("users").where("role", "==", "developer").get();
          const availableDevs = devsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((d: any) => (d.activeProjectCount || 0) < (d.maxProjects || 5));

          availableDevs.sort((a: any, b: any) => (a.activeProjectCount || 0) - (b.activeProjectCount || 0));

          if (availableDevs.length > 0) {
            const selectedDev: any = availableDevs[0];
            updatePayload.assignedDeveloperId = selectedDev.id;
            updatePayload.assignedDeveloperName = selectedDev.name || selectedDev.email || "Developer";
            updatePayload.assignedDeveloperEmail = selectedDev.email || "";
            updatePayload.assignedAt = nowIso;
            updatePayload.assignmentMode = "dynamic";

            const devRef = adminDb!.collection("users").doc(selectedDev.id);
            transaction.update(devRef, {
              activeProjectCount: (selectedDev.activeProjectCount || 0) + 1,
              updatedAt: nowIso,
            });

            assignedDevData = selectedDev;
          }
        }

        // f. Finalize Coupon Redemption (Phase 2)
        if (orderData.couponId) {
          const couponRef = adminDb!.collection("coupons").doc(orderData.couponId);
          const couponSnap = await transaction.get(couponRef);
          if (couponSnap.exists) {
            const cData = couponSnap.data() || {};
            const userIdentifier = orderData.userId || orderData.userEmail;
            const existingUsers = cData.usedByUsers || [];
            const newUsers = existingUsers.includes(userIdentifier) ? existingUsers : [...existingUsers, userIdentifier];

            transaction.update(couponRef, {
              usedCount: (cData.usedCount || 0) + 1,
              pendingReservations: Math.max(0, (cData.pendingReservations || 1) - 1),
              usedByUsers: newUsers,
              updatedAt: nowIso,
            });
          }
        }
      } else if (expectedMilestone === "final") {
        updatePayload.finalPaid = true;
        updatePayload.finalPaymentId = txnId;
        updatePayload.finalPaidAt = nowIso;
        updatePayload.finalPaymentMethod = "paytm_gateway";
        updatePayload.status = "completed";

        // Decrement developer load upon project completion
        if (orderData.assignedDeveloperId) {
          const devRef = adminDb!.collection("users").doc(orderData.assignedDeveloperId);
          const devSnap = await transaction.get(devRef);
          if (devSnap.exists) {
            const currentDev = devSnap.data() || {};
            transaction.update(devRef, {
              activeProjectCount: Math.max(0, (currentDev.activeProjectCount || 1) - 1),
              updatedAt: nowIso,
            });
          }
        }
      } else if (expectedMilestone === "maintenance") {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        updatePayload.maintenanceActive = true;
        updatePayload.maintenancePaid = true;
        updatePayload.maintenancePaymentId = txnId;
        updatePayload.maintenancePaidAt = nowIso;
        updatePayload.maintenanceExpiresAt = expiryDate.toISOString();
      }

      transaction.update(orderRef, updatePayload);

      // g. Record in Idempotency Ledger
      transaction.set(eventRef, {
        provider: "paytm",
        transactionId: txnId,
        milestone: expectedMilestone,
        orderId: internalOrderId,
        amount: receivedAmount,
        processedAt: nowIso,
      });

      return {
        isDuplicate: false,
        orderData,
        assignedDevData,
        expectedMilestone,
      };
    });

    if (transactionResult.isDuplicate) {
      return NextResponse.redirect(
        new URL(`/dashboard?payment_status=success&orderId=${internalOrderId}&msg=already_processed`, req.url)
      );
    }

    await logSecurityEvent({
      action: "paytm:payment_verified",
      resourceId: internalOrderId,
      status: "success",
      ip: clientIp,
      metadata: { txnId, expectedMilestone, amount: paytmParams.TXNAMOUNT },
    });

    return NextResponse.redirect(
      new URL(`/dashboard?payment_status=success&orderId=${internalOrderId}&milestone=${expectedMilestone}`, req.url)
    );
  } catch (error: any) {
    console.error("Paytm callback critical error:", error);
    await logSecurityEvent({
      action: "paytm:callback_error",
      status: "failed",
      ip: clientIp,
      reason: error?.message || "Internal transaction error",
    });

    return NextResponse.redirect(
      new URL(`/dashboard?payment_status=error&msg=${encodeURIComponent(error?.message || "Processing error")}`, req.url)
    );
  }
}
