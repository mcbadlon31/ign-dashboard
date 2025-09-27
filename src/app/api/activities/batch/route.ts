
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { canAccessPersonId, getEmailFromReq } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const email = await getEmailFromReq(req);
  const body = await req.json();
  const { personIds, type, notes, date } = body ?? {};
  if (!Array.isArray(personIds) || personIds.length === 0) return NextResponse.json({ error: "personIds required" }, { status: 400 });

  const dt = date ? new Date(date) : new Date();
  const month = new Date(dt.getFullYear(), dt.getMonth(), 1);

  const allowedIds: string[] = [];
  for (const pid of personIds) {
    if (await canAccessPersonId(email, pid)) allowedIds.push(pid);
  }
  if (allowedIds.length === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await audit('activity.batch', { userEmail: email, meta: { count: allowedIds.length, type, date } });
  const created = await db.$transaction(allowedIds.map(pid => db.activityLog.create({
    data: { personId: pid, type: type ?? "FollowUp", notes: notes ?? "", date: dt, month },
  })));

  return NextResponse.json({ ok: true, created: created.length });
}
