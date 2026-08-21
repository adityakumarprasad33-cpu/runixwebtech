import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";

export type Role = "super_admin" | "admin" | "developer" | "user";

export enum Permission {
  // Orders
  ORDER_READ_OWN = "order:read_own",
  ORDER_READ_ASSIGNED = "order:read_assigned",
  ORDER_READ_ALL = "order:read_all",
  ORDER_VERIFY_ADVANCE = "order:verify_advance",
  ORDER_VERIFY_FINAL = "order:verify_final",
  ORDER_ASSIGN_DEV = "order:assign_dev",
  ORDER_GRANT_MAINTENANCE = "order:grant_maintenance",
  ORDER_UPDATE_STATUS = "order:update_status",

  // Projects & CMS
  PROJECT_READ = "project:read",
  PROJECT_CREATE = "project:create",
  PROJECT_UPDATE = "project:update",
  PROJECT_DELETE = "project:delete",

  // Settings & Financials
  PAYMENT_SETTINGS_UPDATE = "settings:payment_update",
  COUPON_MANAGE = "coupon:manage",
  OFFER_MANAGE = "offer:manage",

  // Users & Roles
  USER_READ_ALL = "user:read_all",
  USER_ROLE_UPDATE = "user:role_update",
  AUDIT_LOG_READ = "audit:log_read",
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: Object.values(Permission),
  admin: [
    Permission.ORDER_READ_ALL,
    Permission.ORDER_VERIFY_ADVANCE,
    Permission.ORDER_VERIFY_FINAL,
    Permission.ORDER_ASSIGN_DEV,
    Permission.ORDER_GRANT_MAINTENANCE,
    Permission.ORDER_UPDATE_STATUS,
    Permission.PROJECT_READ,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.COUPON_MANAGE,
    Permission.OFFER_MANAGE,
    Permission.USER_READ_ALL,
    Permission.AUDIT_LOG_READ,
  ],
  developer: [
    Permission.ORDER_READ_ASSIGNED,
    Permission.PROJECT_READ,
  ],
  user: [
    Permission.ORDER_READ_OWN,
    Permission.PROJECT_READ,
  ],
};

export interface AuthenticatedUserContext {
  uid: string;
  email: string;
  role: Role;
  name: string;
}

/**
 * Authoritatively verifies Firebase ID token and asserts the requested permission.
 * Returns the AuthenticatedUserContext or a NextResponse error.
 */
export async function requireAuthAndPermission(
  req: NextRequest,
  requiredPermission?: Permission
): Promise<AuthenticatedUserContext | NextResponse> {
  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { success: false, error: "Authentication service unavailable." },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Missing authentication token." },
      { status: 401 }
    );
  }

  const token = authHeader.split("Bearer ")[1].trim();
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid bearer token format." },
      { status: 401 }
    );
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token, true);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: User record not found." },
        { status: 401 }
      );
    }

    const userData = userDoc.data() || {};
    const role = (userData.role || "user") as Role;

    if (requiredPermission) {
      const allowedPermissions = ROLE_PERMISSIONS[role] || [];
      if (!allowedPermissions.includes(requiredPermission)) {
        return NextResponse.json(
          { success: false, error: `Forbidden: Insufficient privileges for action.` },
          { status: 403 }
        );
      }
    }

    return {
      uid,
      email: userData.email || decodedToken.email || "",
      role,
      name: userData.name || decodedToken.name || "User",
    };
  } catch (err: any) {
    console.error("Token verification failure:", err?.message || err);
    return NextResponse.json(
      { success: false, error: "Unauthorized: Token verification failed or expired." },
      { status: 401 }
    );
  }
}
