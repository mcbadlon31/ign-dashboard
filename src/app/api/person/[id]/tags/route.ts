
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEmailFromReq, canAccessPersonId } from "@/lib/rbac";
import { audit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: { id: string }}){
  const rows = await db.personTag.findMany({ where: { personId: params.id }, include: { tag: true } });
  return NextResponse.json(rows.map(r => r.tag));
}

export async function POST(req: NextRequest, { params }: { params: { id: string }}){
  const email = await getEmailFromReq(req);
  const ok = await canAccessPersonId(email, params.id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { tagId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });
  await db.personTag.upsert({ where: { personId_tagId: { personId: params.id, tagId } }, update: {}, create: { personId: params.id, tagId } });
  await audit('person.tag.add', { userEmail: email || undefined, entity:'person', entityId: params.id, meta: { tagId } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string }}){
  const email = await getEmailFromReq(req);
  const ok = await canAccessPersonId(email, params.id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { tagId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });
  await db.personTag.delete({ where: { personId_tagId: { personId: params.id, tagId } } });
  await audit('person.tag.remove', { userEmail: email || undefined, entity:'person', entityId: params.id, meta: { tagId } });
  return NextResponse.json({ ok: true });
}
