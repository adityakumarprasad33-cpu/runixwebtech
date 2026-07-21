import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AdminActionPayload {
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  details?: Record<string, any>;
}

/**
 * Logs an admin action to Firestore `admin_activity_logs` collection.
 * Also attempts to capture the admin's public IP via ipapi.co.
 */
export async function logAdminAction(payload: AdminActionPayload): Promise<void> {
  try {
    // Fetch IP + geo info (best-effort, no throw on fail)
    let ip = "Unknown";
    let location = "Unknown";
    try {
      const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (res.ok) {
        const geo = await res.json();
        ip = geo.ip || "Unknown";
        location = [geo.city, geo.region, geo.country_name]
          .filter(Boolean)
          .join(", ") || "Unknown";
      }
    } catch {
      // Silent fail — IP logging is non-critical
    }

    await addDoc(collection(db, "admin_activity_logs"), {
      adminId: payload.adminId,
      adminName: payload.adminName,
      adminEmail: payload.adminEmail,
      ip,
      location,
      action: payload.action,
      details: payload.details || {},
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[logAdminAction] Failed to write audit log:", e);
  }
}
