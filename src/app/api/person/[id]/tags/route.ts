import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { getEmailFromReq, canAccessPersonId } from "@/lib/rbac";
import { audit } from "@/lib/audit";

async function ensurePersonInOrg(personId: string, orgId: string) {
  const person = await db.person.findUnique({ where: { id: personId }, select: { orgId: true } });
  return !!person && person.orgId === orgId;
}

export async function GET(req: NextRequest, { params }: { params: { id: string }}) {
  const email = await getEmailFromReq(req);
  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "No organization access" }, { status: 403 });
  const allowed = await canAccessPersonId(email, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const inOrg = await ensurePersonInOrg(params.id, orgId);
  if (!inOrg) return NextResponse.json({ error: "Person not found" }, { status: 404 });
  const rows = await db.personTag.findMany({ where: { personId: params.id, tag: { orgId } }, include: { tag: true } });
  return NextResponse.json(rows.map(r => r.tag));
}

export async function POST(req: NextRequest, { params }: { params: { id: string }}) {
  const email = await getEmailFromReq(req);
  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "No organization access" }, { status: 403 });
  const allowed = await canAccessPersonId(email, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const inOrg = await ensurePersonInOrg(params.id, orgId);
  if (!inOrg) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const { tagId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });
  const tag = await db.tag.findUnique({ where: { id: tagId }, select: { orgId: true } });
  if (!tag || tag.orgId !== orgId) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  await db.personTag.upsert({ where: { personId_tagId: { personId: params.id, tagId } }, update: {}, create: { personId: params.id, tagId } });
  await audit("person.tag.add", { userEmail: email || undefined, entity: "person", entityId: params.id, meta: { tagId } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string }}) {
  const email = await getEmailFromReq(req);
  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "No organization access" }, { status: 403 });
  const allowed = await canAccessPersonId(email, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const inOrg = await ensurePersonInOrg(params.id, orgId);
  if (!inOrg) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const { tagId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });
  const tag = await db.tag.findUnique({ where: { id: tagId }, select: { orgId: true } });
  if (!tag || tag.orgId !== orgId) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  await db.personTag.delete({ where: { personId_tagId: { personId: params.id, tagId } } });
  await audit("person.tag.remove", { userEmail: email || undefined, entity: "person", entityId: params.id, meta: { tagId } });
  return NextResponse.json({ ok: true });
}
