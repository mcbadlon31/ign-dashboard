
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(){
  const users = await db.user.findMany({ select: { email: true, appRole: true } });
  const coaches = users.filter(u => ['Coach','Leader','Admin'].includes(u.appRole || 'Coach')).map(u => ({ email: u.email, role: u.appRole }));
  if (coaches.length === 0) {
    const rows = await db.person.findMany({ where: { coachEmail: { not: null } }, select: { coachEmail: true }, distinct: ["coachEmail"] });
    return NextResponse.json(rows.filter(r=>r.coachEmail).map(r => ({ email: r.coachEmail as string, role: 'Coach' })));
  }
  return NextResponse.json(coaches);
}
