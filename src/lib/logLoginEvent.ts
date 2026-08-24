interface LoginLogData {
  email: string;
  action: "login" | "register" | "login_google" | "register_google" | string;
  userId?: string;
}

/**
 * Dispatches login/register telemetry to the secure server API /api/auth/log-login.
 */
export async function logLoginEvent({ email, action, userId }: LoginLogData) {
  try {
    let ipData: any = {};
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const text = await res.text();
        if (text && text.startsWith("{")) {
          ipData = JSON.parse(text);
        }
      }
    } catch {
      // Non-critical telemetry fallback
    }

    await fetch("/api/auth/log-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        action,
        userId: userId || null,
        city: ipData.city || undefined,
        country: ipData.country_name || undefined,
        countryCode: ipData.country_code || undefined,
        timezone:
          ipData.timezone ||
          (typeof Intl !== "undefined"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : undefined),
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }),
    }).catch(() => {});
  } catch (err) {
    // Non-blocking telemetry
  }
}
