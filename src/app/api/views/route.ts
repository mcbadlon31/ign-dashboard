
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEmailFromReq, isAdminEmail } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const views = await db.savedView.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(views);
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromReq(req);
  if (!email && process.env.DEV_BYPASS_AUTH !== "true") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, slug, outreachId, isPublic = false, filters = null } = body ?? {};
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  const v = await db.savedView.create({ data: { name, slug, outreachId: outreachId || null, createdBy: email || null, isPublic, filters } });
  return NextResponse.json(v, { status: 201 });
}
