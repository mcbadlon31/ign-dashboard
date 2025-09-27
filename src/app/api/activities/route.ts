
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { canAccessPersonId, getEmailFromReq } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const email = await getEmailFromReq(req);
  const body = await req.json();
  const { personId, type, notes } = body ?? {};
  if (!personId) return NextResponse.json({ error: "personId required" }, { status: 400 });

  const allowed = await canAccessPersonId(email, personId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  await audit('activity.create', { userEmail: email, entity:'person', entityId: personId, meta: { type, notes } });
  const entry = await db.activityLog.create({
    data: { personId, type: type ?? "FollowUp", notes: notes ?? "", month },
  });
  return NextResponse.json(entry, { status: 201 });
}
