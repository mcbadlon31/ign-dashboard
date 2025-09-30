import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { canAccessOutreachId, getEmailFromReq, isAdminEmail } from "@/lib/rbac";

function candidateEmails(email: string) {
  const normalized = email.toLowerCase();
  return Array.from(new Set([email, normalized].filter(Boolean))) as string[];
}

export async function GET(req: NextRequest) {
  const bypass = process.env.DEV_BYPASS_AUTH === "true";
  const email = await getEmailFromReq(req);
  if (!bypass && !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "No organization access" }, { status: 403 });

  const isAdmin = email ? isAdminEmail(email) : false;
  const outreachIds = new Set<string>();
  if (!bypass && !isAdmin && email) {
    const rows = await db.outreachAccess.findMany({
      where: { userEmail: { in: candidateEmails(email) }, outreach: { orgId } },
      select: { outreachId: true },
    });
    rows.forEach(row => outreachIds.add(row.outreachId));
  }

  const accessOr: any[] = [];
  if (bypass || isAdmin) {
    // no additional restrictions
  } else {
    accessOr.push({ isPublic: true });
    if (email) accessOr.push({ createdBy: email });
    if (outreachIds.size) accessOr.push({ outreachId: { in: Array.from(outreachIds) } });
    if (!accessOr.length) {
      return NextResponse.json([], { status: 200 });
    }
  }

  const where: any = {
    AND: [
      {
        OR: [
          { outreachId: null },
          { outreach: { orgId } },
        ],
      },
    ],
  };

  if (!(bypass || isAdmin)) {
    where.AND.push({ OR: accessOr });
  }

  const views = await db.savedView.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(views);
}

export async function POST(req: NextRequest) {
  const bypass = process.env.DEV_BYPASS_AUTH === "true";
  const email = await getEmailFromReq(req);
  if (!bypass && !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "No organization access" }, { status: 403 });

  const body = await req.json();
  const { name, slug, outreachId, isPublic = false, filters = null } = body ?? {};
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });

  if (outreachId) {
    const outreach = await db.outreach.findFirst({ where: { id: outreachId, orgId } });
    if (!outreach) return NextResponse.json({ error: "Invalid outreach" }, { status: 400 });
    if (!bypass) {
      const allowed = await canAccessOutreachId(email, outreachId);
      if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const view = await db.savedView.create({
    data: {
      name,
      slug,
      outreachId: outreachId || null,
      createdBy: email || null,
      isPublic,
      filters,
    },
  });
  return NextResponse.json(view, { status: 201 });
}
