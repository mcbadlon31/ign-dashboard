import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { getEmailFromReq, canAccessPersonId } from "@/lib/rbac";
import { audit } from "@/lib/audit";

async function ensurePersonInOrg(personId: string, orgId: string) {
  const person = await db.person.findUnique({ where: { id: personId }, select: { orgId: true } });
  if (!person || person.orgId !== orgId) return false;
  return true;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string }}){
  const orgId = await resolveOrgId();
  if (!orgId) return NextResponse.json({ error: "Select an organization" }, { status: 400 });
  const inOrg = await ensurePersonInOrg(params.id, orgId);
  if (!inOrg) return NextResponse.json({ error: "Person not found" }, { status: 404 });
  const rows = await db.personTag.findMany({ where: { personId: params.id, tag: { orgId } }, include: { tag: true } });
  return NextResponse.json(rows.map(r => r.tag));
}

export async function POST(req: NextRequest, { params }: { params: { id: string }}){
  const orgId = await resolveOrgId();
  if (!orgId) return NextResponse.json({ error: "Select an organization" }, { status: 400 });
  const email = await getEmailFromReq(req);
  const ok = await canAccessPersonId(email, params.id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const inOrg = await ensurePersonInOrg(params.id, orgId);
  if (!inOrg) return NextResponse.json({ error: "Person not found" }, { status: 404 });
  const { tagId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });
  const tag = await db.tag.findUnique({ where: { id: tagId }, select: { orgId: true } });
  if (!tag || tag.orgId !== orgId) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  await db.personTag.upsert({ where: { personId_tagId: { personId: params.id, tagId } }, update: {}, create: { personId: params.id, tagId } });
  await audit('person.tag.add', { userEmail: email || undefined, entity:'person', entityId: params.id, meta: { tagId } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string }}){
  const orgId = await resolveOrgId();
  if (!orgId) return NextResponse.json({ error: "Select an organization" }, { status: 400 });
  const email = await getEmailFromReq(req);
  const ok = await canAccessPersonId(email, params.id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const inOrg = await ensurePersonInOrg(params.id, orgId);
  if (!inOrg) return NextResponse.json({ error: "Person not found" }, { status: 404 });
  const { tagId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });
  const tag = await db.tag.findUnique({ where: { id: tagId }, select: { orgId: true } });
  if (!tag || tag.orgId !== orgId) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  await db.personTag.delete({ where: { personId_tagId: { personId: params.id, tagId } } });
  await audit('person.tag.remove', { userEmail: email || undefined, entity:'person', entityId: params.id, meta: { tagId } });
  return NextResponse.json({ ok: true });
}
