import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { getEmailFromReq } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const bypass = process.env.DEV_BYPASS_AUTH === "true";
  const email = await getEmailFromReq(req);
  if (!bypass && !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "No organization access" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ people: [], tags: [], outreaches: [] });

  const people = await db.person.findMany({
    where: { orgId, fullName: { contains: q } },
    include: { outreach: true },
    take: 20,
  });
  const tags = await db.tag.findMany({ where: { orgId, name: { contains: q } }, take: 20 });
  const outreaches = await db.outreach.findMany({ where: { orgId, name: { contains: q } }, take: 20 });
  return NextResponse.json({ people, tags, outreaches });
}
