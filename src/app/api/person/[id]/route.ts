
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string }}){
  const p = await db.person.findUnique({
    where: { id: params.id },
    include: {
      assignment: { include: { role: true } },
      goalPlans: {
        where: { status: { in: ["PLANNED", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { target: true, milestones: true },
      },
      activities: { orderBy: { date: "desc" }, take: 50 },
    }
  });
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });

  const goal = p.goalPlans[0] ?? null;
  return NextResponse.json({
    id: p.id,
    name: p.fullName,
    currentRole: p.assignment?.role?.name ?? null,
    goal: goal ? { id: goal.target.id, name: goal.target.name, colorHex: goal.target.colorHex } : null,
    milestones: goal ? goal.milestones.map(m => ({ id: m.id, name: m.name, completed: m.completed })) : [],
    activities: p.activities.map(a => ({ id: a.id, date: a.date, type: a.type, notes: a.notes })),
  });
}


export async function PATCH(req: Request, { params }: { params: { id: string }}){
  const body = await req.json();
  const data: any = {};
  if (typeof body.fullName === 'string') data.fullName = body.fullName;

  // Update outreach by id
  if (typeof body.outreachId === 'string') data.outreachId = body.outreachId || null;

  if (typeof body.coachEmail === 'string') data.coachEmail = body.coachEmail || null;

  // Update current role by name: creates/updates assignment
  if (typeof body.currentRoleName === 'string') {
    const role = await db.role.findFirst({ where: { name: body.currentRoleName } });
    if (role) {
      // upsert assignment
      const existing = await db.assignment.findFirst({ where: { personId: params.id } });
      if (existing) {
        await db.assignment.update({ where: { id: existing.id }, data: { activeRoleId: role.id } });
      } else {
        await db.assignment.create({ data: { personId: params.id, activeRoleId: role.id } });
      }
    }
  }

  if (Object.keys(data).length) {
    await audit('person.update', { userEmail: undefined, entity:'person', entityId: params.id, meta: data });
    await db.person.update({ where: { id: params.id }, data });
  }
  return NextResponse.json({ ok: true });
}
