import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthAndPermission(req, Permission.ORDER_READ_ALL);
    if (authResult instanceof NextResponse) return authResult;

    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
    }

    // Fetch collections bounded and in parallel
    const [
      usersSnap,
      projectsSnap,
      ordersSnap,
      loginLogsSnap,
      adminLogsSnap,
      notificationsSnap,
      offersSnap,
      couponsSnap,
      settingsSnap,
    ] = await Promise.all([
      adminDb.collection("users").limit(100).get(),
      adminDb.collection("projects").limit(100).get(),
      adminDb.collection("orders").orderBy("createdAt", "desc").limit(100).get(),
      adminDb.collection("login_logs").orderBy("timestamp", "desc").limit(50).get(),
      adminDb.collection("admin_activity_logs").orderBy("timestamp", "desc").limit(50).get(),
      adminDb.collection("notifications").orderBy("createdAt", "desc").limit(50).get(),
      adminDb.collection("offers").limit(50).get(),
      adminDb.collection("coupons").limit(50).get(),
      adminDb.collection("settings").doc("payment").get(),
    ]);

    const users = usersSnap.docs.map((d: any) => ({
      id: d.id,
      name: d.data().name || "User",
      email: d.data().email || "",
      role: d.data().role || "user",
      company: d.data().company || "",
      activeProjectCount: d.data().activeProjectCount || 0,
      maxProjects: d.data().maxProjects || 5,
      createdAt: d.data().createdAt || "",
    }));

    const dbProjects = projectsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const orders = ordersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const logs = loginLogsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const activityLogs = adminLogsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const notifications = notificationsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const offers = offersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const coupons = couponsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const paymentSettings = settingsSnap.exists ? settingsSnap.data() : null;

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
    console.error("Admin data fetch critical error:", error);
    // Sanitize response — never leak raw internal stack trace or error.message to browser (SEC-014)
    return NextResponse.json(
      { success: false, error: "Internal server error while retrieving operational data." },
      { status: 500 }
    );
  }
}
