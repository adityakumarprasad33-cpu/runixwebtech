import { auth } from "@/lib/firebase";

interface AdminActionPayload {
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  details?: Record<string, any>;
}

/**
 * Sends an admin audit log to the secure server API /api/admin/logs/record.
 */
export async function logAdminAction(payload: AdminActionPayload): Promise<void> {
  try {
    const user = auth?.currentUser;
    if (!user) return;
    const token = await user.getIdToken();

    await fetch("/api/admin/logs/record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: payload.action,
        details: payload.details || {},
      }),
    });
  } catch (e) {
    // Non-blocking
  }
}
