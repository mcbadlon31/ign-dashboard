import { NextRequest, NextResponse } from "next/server";
import stagesCfg from "@/config/stages.json";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { canAccessPersonId, getEmailFromReq } from "@/lib/rbac";

const stageKeys = new Set((stagesCfg as { key: string }[]).map(stage => stage.key));

export async function GET(req: NextRequest) {
  const email = await getEmailFromReq(req);
  const orgId = await resolveOrgId({ email });
  if (!orgId) {
    return NextResponse.json({ error: "No organization access" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const personId = searchParams.get("personId") ?? undefined;

  if (personId && !(await canAccessPersonId(email, personId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where: Record<string, unknown> = { person: { orgId } };
  if (personId) where.personId = personId;

  const rows = await db.personStage.findMany({
    where,
    orderBy: { enteredAt: "desc" },
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromReq(req);
  const orgId = await resolveOrgId({ email });
  if (!orgId) {
    return NextResponse.json({ error: "No organization access" }, { status: 403 });
  }

  const { personId, stage, notes } = await req.json();
  if (!personId || !stage) {
    return NextResponse.json({ error: "personId, stage required" }, { status: 400 });
  }
  if (!stageKeys.has(stage)) {
    return NextResponse.json({ error: "invalid stage" }, { status: 400 });
  }

  if (!(await canAccessPersonId(email, personId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const person = await db.person.findUnique({
    where: { id: personId },
    select: { orgId: true },
  });
  if (!person || person.orgId !== orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = await db.personStage.create({
    data: {
      personId,
      stage,
      notes: notes ? String(notes) : null,
    },
  });

  await db.person.update({
    where: { id: personId },
    data: { currentStage: stage, stageSince: record.enteredAt },
  });

  return NextResponse.json({ ok: true, record }, { status: 201 });
}
