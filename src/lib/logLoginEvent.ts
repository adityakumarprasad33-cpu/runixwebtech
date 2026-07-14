import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LoginLogData {
  email: string;
  action: "login" | "register";
  userId?: string;
}

/**
 * Logs every login/register event to the Firestore `login_logs` collection.
 * Captures: IP, location, timezone, timestamp, user agent, and user email/uid.
 */
export async function logLoginEvent({ email, action, userId }: LoginLogData) {
  try {
    // Fetch IP + location from ipapi.co
    let ipData: any = {};
    try {
      const res = await fetch("https://ipapi.co/json/");
      ipData = await res.json();
    } catch (e) {
      console.error("Failed to fetch IP data for login log:", e);
    }

    await addDoc(collection(db, "login_logs"), {
      email,
      action, // "login" or "register"
      userId: userId || null,
      ip: ipData.ip || "unknown",
      city: ipData.city || "unknown",
      region: ipData.region || "unknown",
      country: ipData.country_name || "unknown",
      countryCode: ipData.country_code || "unknown",
      timezone: ipData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
      isp: ipData.org || "unknown",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      localTime: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Never block the user flow if logging fails
    console.error("Failed to log login event:", err);
  }
}
