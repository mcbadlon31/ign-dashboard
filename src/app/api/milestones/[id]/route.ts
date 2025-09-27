
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { maybeAchieveAndAdvance } from "@/lib/autoNext";
import { audit } from "@/lib/audit";
import { canAccessPersonId, getEmailFromReq } from "@/lib/rbac";

export async function PATCH(req: NextRequest, { params }: { params: { id: string }}){
  const email = await getEmailFromReq(req);
  const body = await req.json();
  const completed = body?.completed ?? true;

  const ms = await db.milestone.findUnique({ where: { id: params.id }, include: { goal: true } });
  if (!ms) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canAccessPersonId(email, ms.goal.personId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await audit('milestone.toggle', { userEmail: email, entity:'milestone', entityId: params.id, meta: { completed } });
  const updated = await db.milestone.update({ where: { id: params.id }, data: { completed } });

  // Commissioning rule: if all milestones complete, mark goal ACHIEVED
  const goal = await db.goalPlan.findUnique({ where: { id: ms.goalPlanId }, include: { milestones: true } });
  if (goal) {
    const allDone = goal.milestones.every(m => m.id === ms.id ? completed : m.completed);
    if (allDone) {
      await db.goalPlan.update({ where: { id: goal.id }, data: { status: "ACHIEVED" } });
    }
  }

  return NextResponse.json(updated);
}
