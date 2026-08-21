import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { requireAuthAndPermission, Permission } from "@/lib/server/authGuard";
import { getTrustedClientIp } from "@/lib/server/clientIp";
import { logSecurityEvent } from "@/lib/server/securityLogger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ProjectSchema = z.object({
  title: z.string().min(2).max(150),
  client: z.string().max(100).optional().default(""),
  category: z.string().min(1).max(50),
  description: z.string().max(2000).optional().default(""),
  scope: z.string().max(500).optional().default(""),
  timeline: z.string().max(100).optional().default(""),
  image: z.string().max(1000).optional().default(""),
  badge: z.string().max(50).optional().default(""),
  stats: z.record(z.string(), z.string()).optional().default({}),
  technologies: z.array(z.string()).optional().default([]),
  keyFeatures: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.PROJECT_CREATE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parseResult = ProjectSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid project parameters.", details: parseResult.error.flatten() }, { status: 400 });
    }

    const docRef = await adminDb!.collection("projects").add({
      ...parseResult.data,
      createdBy: authResult.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await logSecurityEvent({
      action: "project:create",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: docRef.id,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to create project." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.PROJECT_UPDATE);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: "Project ID required." }, { status: 400 });

    const parseResult = ProjectSchema.partial().safeParse(data);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid project update data." }, { status: 400 });
    }

    await adminDb!.collection("projects").doc(id).update({
      ...parseResult.data,
      updatedBy: authResult.email,
      updatedAt: new Date().toISOString(),
    });

    await logSecurityEvent({
      action: "project:update",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: id,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Project updated." });
  } catch (error: any) {
    console.error("Update project error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update project." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const clientIp = getTrustedClientIp(req);

  try {
    const authResult = await requireAuthAndPermission(req, Permission.PROJECT_DELETE);
    if (authResult instanceof NextResponse) return authResult;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Project ID required." }, { status: 400 });

    await adminDb!.collection("projects").doc(id).delete();

    await logSecurityEvent({
      action: "project:delete",
      actorUid: authResult.uid,
      actorEmail: authResult.email,
      actorRole: authResult.role,
      resourceId: id,
      status: "success",
      ip: clientIp,
    });

    return NextResponse.json({ success: true, message: "Project deleted." });
  } catch (error: any) {
    console.error("Delete project error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete project." }, { status: 500 });
  }
}
