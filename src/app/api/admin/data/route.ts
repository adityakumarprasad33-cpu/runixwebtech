import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_READ_ALL);
    if (authResult instanceof NextResponse) return authResult;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    // Resilient collection reader that catches individual collection failures gracefully
    const safeGetDocs = async (collectionName: string, limitCount = 100) => {
      try {
        const snap = await db.collection(collectionName).limit(limitCount).get();
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn(`Safe read non-critical warning for collection "${collectionName}":`, err);
        return [];
      }
    };

    // Safe settings reader
    const safeGetDoc = async (collectionName: string, docId: string) => {
      try {
        const snap = await db.collection(collectionName).doc(docId).get();
        return snap.exists ? snap.data() : null;
      } catch (err) {
        console.warn(`Safe read warning for doc "${collectionName}/${docId}":`, err);
        return null;
      }
    };

    // Fetch all operational collections concurrently
    const [
      rawUsers,
      dbProjects,
      rawOrders,
      rawLogs,
      rawActivityLogs,
      rawNotifications,
      offers,
      coupons,
      paymentSettings,
    ] = await Promise.all([
      safeGetDocs("users", 150),
      safeGetDocs("projects", 100),
      safeGetDocs("orders", 150),
      safeGetDocs("login_logs", 100),
      safeGetDocs("admin_activity_logs", 100),
      safeGetDocs("notifications", 100),
      safeGetDocs("offers", 50),
      safeGetDocs("coupons", 50),
      safeGetDoc("settings", "payment"),
    ]);

    const users = rawUsers.map((d: any) => ({
      id: d.id,
      name: d.name || "User",
      email: d.email || "",
      role: d.role || "user",
      company: d.company || "",
      activeProjectCount: d.activeProjectCount || 0,
      maxProjects: d.maxProjects || 5,
      designation: d.designation || null,
      department: d.department || null,
      adminPermissions: d.adminPermissions || null,
      createdAt: d.createdAt || "",
    }));

    // In-memory sorting for rock-solid reliability across heterogeneous timestamp types
    const getTime = (val: any) => {
      if (!val) return 0;
      if (typeof val === "string") return new Date(val).getTime() || 0;
      if (val._seconds) return val._seconds * 1000;
      if (val.seconds) return val.seconds * 1000;
      return 0;
    };

    const orders = rawOrders.sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt));
    const logs = rawLogs.sort((a: any, b: any) => getTime(b.timestamp || b.createdAt) - getTime(a.timestamp || a.createdAt));
    const activityLogs = rawActivityLogs.sort((a: any, b: any) => getTime(b.timestamp || b.createdAt) - getTime(a.timestamp || a.createdAt));
    const notifications = rawNotifications.sort((a: any, b: any) => getTime(b.createdAt) - getTime(a.createdAt));

    return NextResponse.json({
      success: true,
      users,
      dbProjects,
      orders,
      logs,
      activityLogs,
      notifications,
      offers,
      coupons,
      paymentSettings,
    });
  } catch (error: any) {
    console.error("Admin data fetch fatal error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch admin data." }, { status: 500 });
  }
}
