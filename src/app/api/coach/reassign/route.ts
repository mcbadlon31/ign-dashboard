
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest){
  const { personIds, coachEmail } = await req.json();
  if (!Array.isArray(personIds) || personIds.length === 0 || !coachEmail) {
    return NextResponse.json({ error: "personIds[] and coachEmail required" }, { status: 400 });
  }
  const res = await db.person.updateMany({ where: { id: { in: personIds } }, data: { coachEmail } });
  await audit("coach.reassign", { meta: { count: res.count, coachEmail } });
  return NextResponse.json({ ok: true, updated: res.count });
}
