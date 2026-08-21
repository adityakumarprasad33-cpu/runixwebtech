import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    // 0. Check if admin SDK is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not initialized. Missing credentials in environment variables." }, { status: 500 });
    }

    // 1. Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Check if user is an admin
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userData = userDoc.data();
    if (userData?.role !== "admin" && userData?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 3. Fetch all required collections in parallel using admin SDK
    const [
      usersSnap,
      projectsSnap,
      ordersSnap,
      loginLogsSnap,
      adminLogsSnap,
      notificationsSnap,
      offersSnap,
      couponsSnap
    ] = await Promise.all([
      adminDb.collection("users").get(),
      adminDb.collection("projects").get(),
      adminDb.collection("orders").get(),
      adminDb.collection("login_logs").get(),
      adminDb.collection("admin_activity_logs").get(),
      adminDb.collection("notifications").get(),
      adminDb.collection("offers").get(),
      adminDb.collection("coupons").get()
    ]);

    const users = usersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const dbProjects = projectsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const orders = ordersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const loginLogs = loginLogsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const adminLogs = adminLogsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const notifications = notificationsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const offers = offersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const coupons = couponsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      success: true,
      users,
      dbProjects,
      orders,
      logs: loginLogs,
      activityLogs: adminLogs,
      notifications,
      offers,
      coupons
    });
  } catch (error: any) {
    console.error("Admin data fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
