import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission, Role } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UpdateRoleSchema = z.object({
  targetUserId: z.string().min(5).max(100),
  role: z.enum(["super_admin", "admin", "developer", "user"]),
  maxProjects: z.number().min(1).max(20).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthAndPermission(req, Permission.USER_READ_ALL);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const limitParam = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const roleFilter = url.searchParams.get("role");

    let q: FirebaseFirestore.Query = adminDb!.collection("users");
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

  try {
    const authResult = await requireAuthAndPermission(req, Permission.USER_ROLE_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = UpdateRoleSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid role update data.", details: parseResult.error.flatten() }, { status: 400 });
    }

    const { targetUserId, role, maxProjects } = parseResult.data;

    // Super admin role assignment requires the actor to be super_admin
    if (role === "super_admin" && authResult.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Only Super Administrators can assign the Super Admin role." }, { status: 403 });
    }

    const userRef = adminDb!.collection("users").doc(targetUserId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: "Target user not found." }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {
      role,
      updatedAt: new Date().toISOString(),
      roleUpdatedBy: authResult.email,
    };
    if (maxProjects !== undefined) {
      updatePayload.maxProjects = maxProjects;
    }

    await userRef.update(updatePayload);

    await logSecurityEvent({
      action: "user:update_role",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: targetUserId,
      status: "success",
      ip: clientIp,
      metadata: { targetUserId, newRole: role },
    });

    return NextResponse.json({ success: true, message: `User role updated to ${role}.` });
  } catch (error: any) {
    console.error("Update role error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update role." }, { status: 500 });
  }
}
