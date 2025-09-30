import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { getEmailFromReq, isAdminEmail } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const bypass = process.env.DEV_BYPASS_AUTH === "true";
  const email = await getEmailFromReq(req);
  if (!bypass && !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "No organization access" }, { status: 403 });

  if (!bypass && (!email || !isAdminEmail(email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const people = await db.person.findMany({ where: { orgId, deletedAt: null }, include: { outreach: true } });
  const map = new Map<string, typeof people>();
  for (const person of people) {
    const key = (person.fullName || "").trim().toLowerCase();
    if (!key) continue;
    const arr = map.get(key) ?? [];
    arr.push(person);
    map.set(key, arr);
  }
  const duplicates = Array.from(map.values()).filter(arr => arr.length > 1);
  return NextResponse.json(duplicates);
}
