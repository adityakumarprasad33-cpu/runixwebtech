import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import PaytmChecksum from "@/lib/paytmChecksum";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const orderIdParam = url.searchParams.get("orderId");
    const milestoneParam = (url.searchParams.get("milestone") || "advance").toLowerCase();

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

    const orderId = orderIdParam || paytmParams.ORDERID?.split("_")[0];
    const milestone = milestoneParam || (paytmParams.ORDERID?.includes("_FINAL_") ? "final" : "advance");

    if (!orderId) {
      return NextResponse.redirect(new URL("/dashboard?payment_status=error&msg=missing_order", req.url));
    }

    const mkey = process.env.PAYTM_MERCHANT_KEY;
    const isSuccess =
      paytmParams.STATUS === "TXN_SUCCESS" ||
      paytmParams.RESPCODE === "01" ||
      paytmParams.simulated === "true" ||
      paytmParams.simulated === true;

    // Checksum verification if secret key is configured and not simulated
    if (mkey && paytmParams.CHECKSUMHASH && !paytmParams.simulated) {
      const isValid = PaytmChecksum.verifySignature(paytmParams, mkey, paytmParams.CHECKSUMHASH);
      if (!isValid) {
        console.error("Paytm signature verification failed for order:", orderId);
        return NextResponse.redirect(new URL(`/dashboard?payment_status=invalid_signature&orderId=${orderId}`, req.url));
      }
    }

    if (isSuccess && adminDb) {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        const currentData = orderDoc.data() || {};
        const updatePayload: Record<string, any> = {
          updatedAt: new Date().toISOString(),
        };

        if (milestone === "advance") {
          updatePayload.advancePaid = true;
          updatePayload.advancePaymentId = paytmParams.TXNID || `TXN_${Date.now()}`;
          updatePayload.advancePaidAt = new Date().toISOString();
          updatePayload.paymentMethod = "paytm_gateway";
          // If was awaiting advance, transition to in_progress
          if (currentData.status === "awaiting_advance" || !currentData.status) {
            updatePayload.status = "in_progress";
          }

          // ⚡ Dynamic Auto-Assignment to the least loaded available developer
          if (!currentData.assignedDeveloperId) {
            try {
              const devsSnap = await adminDb.collection("users").where("role", "==", "developer").get();
              const availableDevs = devsSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((d: any) => (d.activeProjectCount || 0) < (d.maxProjects || 5));

              // Sort by lowest active project load
              availableDevs.sort((a: any, b: any) => (a.activeProjectCount || 0) - (b.activeProjectCount || 0));

              if (availableDevs.length > 0) {
                const selectedDev: any = availableDevs[0];
                updatePayload.assignedDeveloperId = selectedDev.id;
                updatePayload.assignedDeveloperName = selectedDev.name || selectedDev.email || "Developer";
                updatePayload.assignedDeveloperEmail = selectedDev.email || "";
                updatePayload.assignedAt = new Date().toISOString();
                updatePayload.assignmentMode = "dynamic";

                // Increment selected developer's active count
                await adminDb.collection("users").doc(selectedDev.id).update({
                  activeProjectCount: (selectedDev.activeProjectCount || 0) + 1,
                });

                // Notify developer
                await adminDb.collection("notifications").add({
                  title: "⚡ Dynamic Auto-Assignment: New Project!",
                  message: `You have been automatically assigned to "${currentData.planName || "New Project"}" based on available capacity. Visit your Developer Workspace to get started.`,
                  actionLink: "/dashboard/workspace",
                  actionText: "Open Workspace",
                  targetType: "user",
                  targetUserId: selectedDev.id,
                  targetEmail: selectedDev.email || null,
                  senderName: "Auto-Assignment Engine",
                  senderRole: "System",
                  createdAt: new Date().toISOString(),
                  readBy: [],
                  clearedBy: [],
                });
              }
            } catch (assignErr) {
              console.warn("Dynamic auto-assignment notice:", assignErr);
            }
          }
        } else if (milestone === "final") {
          updatePayload.finalPaid = true;
          updatePayload.finalPaymentId = paytmParams.TXNID || `TXN_${Date.now()}`;
          updatePayload.finalPaidAt = new Date().toISOString();
          updatePayload.status = "completed";

          // Auto-decrement assigned developer's active count on final completion
          if (currentData.assignedDeveloperId) {
            try {
              const devRef = adminDb.collection("users").doc(currentData.assignedDeveloperId);
              const devDoc = await devRef.get();
              if (devDoc.exists) {
                const currentCount = devDoc.data()?.activeProjectCount || 0;
                await devRef.update({
                  activeProjectCount: Math.max(0, currentCount - 1),
                });
              }
            } catch (decErr) {
              console.warn("Auto-decrement developer capacity notice:", decErr);
            }
          }
        } else if (milestone === "maintenance") {
          const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          updatePayload.maintenanceActive = true;
          updatePayload.maintenancePaid = true;
          updatePayload.maintenancePaidAt = new Date().toISOString();
          updatePayload.maintenanceExpiresAt = expirationDate;
          updatePayload.maintenancePaymentId = paytmParams.TXNID || `TXN_${Date.now()}`;
          updatePayload.maintenanceAmount = Number(paytmParams.TXNAMOUNT || 1999);

          // ⚡ Dynamic Auto-Assignment for Maintenance
          let assignedMaintenanceDev: any = null;

          try {
            // Priority 1: Check original project developer if available and has capacity
            if (currentData.assignedDeveloperId) {
              const origDevDoc = await adminDb.collection("users").doc(currentData.assignedDeveloperId).get();
              if (origDevDoc.exists) {
                const origDev = origDevDoc.data();
                if (origDev?.role === "developer" && (origDev.activeProjectCount || 0) < (origDev.maxProjects || 5)) {
                  assignedMaintenanceDev = { id: currentData.assignedDeveloperId, ...origDev };
                  updatePayload.maintenanceAssignmentMode = "continuity_original_dev";
                }
              }
            }

            // Priority 2: Fallback to least loaded active developer
            if (!assignedMaintenanceDev) {
              const devsSnap = await adminDb.collection("users").where("role", "==", "developer").get();
              const availableDevs = devsSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((d: any) => (d.activeProjectCount || 0) < (d.maxProjects || 5));

              availableDevs.sort((a: any, b: any) => (a.activeProjectCount || 0) - (b.activeProjectCount || 0));

              if (availableDevs.length > 0) {
                assignedMaintenanceDev = availableDevs[0];
                updatePayload.maintenanceAssignmentMode = "dynamic_least_loaded";
              }
            }

            if (assignedMaintenanceDev) {
              updatePayload.maintenanceAssignedDevId = assignedMaintenanceDev.id;
              updatePayload.maintenanceAssignedDevName = assignedMaintenanceDev.name || assignedMaintenanceDev.email || "Maintenance Engineer";
              updatePayload.maintenanceAssignedDevEmail = assignedMaintenanceDev.email || "";
              updatePayload.maintenanceAssignedAt = new Date().toISOString();

              // Increment active project count
              await adminDb.collection("users").doc(assignedMaintenanceDev.id).update({
                activeProjectCount: (assignedMaintenanceDev.activeProjectCount || 0) + 1,
              });

              // Notify assigned engineer
              await adminDb.collection("notifications").add({
                title: "🛠️ New Maintenance Assignment!",
                message: `You have been assigned as the Maintenance Engineer for "${currentData.planName || "Website"}". Access the Maintenance Desk to receive tasks.`,
                actionLink: "/dashboard/workspace",
                actionText: "Open Maintenance Desk",
                targetType: "user",
                targetUserId: assignedMaintenanceDev.id,
                targetEmail: assignedMaintenanceDev.email || null,
                senderName: "Maintenance Department",
                senderRole: "System",
                createdAt: new Date().toISOString(),
                readBy: [],
                clearedBy: [],
              });
            }
          } catch (maintAssignErr) {
            console.warn("Maintenance auto-assignment notice:", maintAssignErr);
          }
        }

        await orderRef.update(updatePayload);

        // Auto-create notification for user
        await adminDb.collection("notifications").add({
          title: `Payment Received: ${
            milestone === "advance"
              ? "50% Advance"
              : milestone === "final"
              ? "50% Final Settlement"
              : "Website Maintenance Retainer (30 Days)"
          }`,
          message: `Your payment of ₹${paytmParams.TXNAMOUNT || "amount"} for "${currentData.planName || "Project"}" has been confirmed. ${
            milestone === "advance"
              ? "Development has officially started!"
              : milestone === "final"
              ? "Project handover and assets are now fully unlocked!"
              : "Your 30-day website maintenance & dedicated engineer coverage is now active!"
          }`,
          targetType: "user",
          targetUserId: currentData.userId || null,
          targetEmail: currentData.userEmail || null,
          senderName: "Paytm Payment Gateway",
          senderRole: "System",
          createdAt: new Date().toISOString(),
          readBy: [],
          clearedBy: [],
        });
      }
    }

    // Redirect to dashboard with success query param
    return NextResponse.redirect(
      new URL(`/dashboard?payment_status=success&orderId=${orderId}&milestone=${milestone}`, req.url)
    );
  } catch (error: any) {
    console.error("Paytm callback error:", error);
    return NextResponse.redirect(new URL("/dashboard?payment_status=error", req.url));
  }
}
