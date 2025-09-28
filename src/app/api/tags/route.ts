import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { assertAdmin } from "@/lib/rbac";

export async function GET(req: NextRequest){
  const orgId = await resolveOrgId();
  if (!orgId) return NextResponse.json({ error: "Select an organization" }, { status: 400 });
  const tags = await db.tag.findMany({ where: { orgId }, orderBy: { name: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest){
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const orgId = await resolveOrgId();
  if (!orgId) return NextResponse.json({ error: "Select an organization" }, { status: 400 });

  const { name, colorHex } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const tag = await db.tag.upsert({
    where: { orgId_name: { orgId, name } },
    update: { colorHex: colorHex ?? null },
    create: { name, colorHex: colorHex ?? null, orgId },
  });
  return NextResponse.json(tag, { status: 201 });
}
