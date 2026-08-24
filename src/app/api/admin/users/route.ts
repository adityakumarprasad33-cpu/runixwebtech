import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission, Role } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UpdateUserSchema = z.object({
  targetUserId: z.string().min(5).max(100),
  role: z.enum(["super_admin", "admin", "developer", "user"]).optional(),
  maxProjects: z.number().min(1).max(20).optional(),
  adminPermissions: z.record(z.string(), z.boolean()).optional(),
  designation: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
  }

  try {
    const authResult = await requireAuthAndPermission(req, Permission.USER_READ_ALL);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const limitParam = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const roleFilter = url.searchParams.get("role");

    let q: FirebaseFirestore.Query = db.collection("users");
    if (roleFilter) {
      q = q.where("role", "==", roleFilter);
    }

    const snap = await q.limit(limitParam).get();
    const users = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || "User",
        email: data.email || "",
        role: data.role || "user",
        company: data.company || "",
        activeProjectCount: data.activeProjectCount || 0,
        maxProjects: data.maxProjects || 5,
        designation: data.designation || null,
        department: data.department || null,
        adminPermissions: data.adminPermissions || null,
        createdAt: data.createdAt || "",
      };
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);
  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ success: false, error: "Database service unavailable." }, { status: 503 });
  }

  try {
    const authResult = await requireAuthAndPermission(req, Permission.USER_ROLE_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = UpdateUserSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid user update data.", details: parseResult.error.flatten() }, { status: 400 });
    }

    const { targetUserId, role, maxProjects, adminPermissions, designation, department } = parseResult.data;

    // Super admin role assignment requires the actor to be super_admin
    if (role === "super_admin" && authResult.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Only Super Administrators can assign the Super Admin role." }, { status: 403 });
    }

    const userRef = db.collection("users").doc(targetUserId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: "Target user not found." }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
      updatedBy: authResult.email,
    };

    if (role !== undefined) {
      updatePayload.role = role;
      updatePayload.roleUpdatedBy = authResult.email;
    }
    if (maxProjects !== undefined) {
      updatePayload.maxProjects = maxProjects;
    }
    if (adminPermissions !== undefined) {
      updatePayload.adminPermissions = adminPermissions;
    }
    if (designation !== undefined) {
      updatePayload.designation = designation;
    }
    if (department !== undefined) {
      updatePayload.department = department;
    }

    await userRef.update(updatePayload);

    await logSecurityEvent({
      action: "user:update_profile_admin",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: targetUserId,
      status: "success",
      ip: clientIp,
      metadata: { targetUserId, role, maxProjects, designation, department },
    });

    return NextResponse.json({ success: true, message: "User attributes updated successfully." });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update user." }, { status: 500 });
  }
}
