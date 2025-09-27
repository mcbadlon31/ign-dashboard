
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { maybeAchieveAndAdvance } from "@/lib/autoNext";
import { getEmailFromReq, canAccessPersonId } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const email = await getEmailFromReq(req);
  const body = await req.json();
  const { updates }:{ updates: { personId: string; pct: number }[] } = body ?? { updates: [] };
  if (!Array.isArray(updates) || updates.length === 0) return NextResponse.json({ error: "updates required" }, { status: 400 });

  let count = 0;
  for (const u of updates) {
    const ok = await canAccessPersonId(email, u.personId);
    if (!ok) continue;
    const goal = await db.goalPlan.findFirst({
      where: { personId: u.personId, status: { in: ["PLANNED", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      include: { milestones: true },
    });
    if (!goal) continue;
    const total = goal.milestones.length || 1;
    const shouldComplete = Math.round((u.pct/100) * total);
    const sorted = goal.milestones.sort((a,b)=> (a.completed === b.completed) ? 0 : (a.completed ? -1 : 1));
    for (let i=0;i<sorted.length;i++){
      const m = sorted[i];
      const completed = i < shouldComplete;
      if (m.completed !== completed) {
        await db.milestone.update({ where: { id: m.id }, data: { completed } });
      }
    }
    if (u.pct > 0 && goal.status === "PLANNED") {
      await db.goalPlan.update({ where: { id: goal.id }, data: { status: "IN_PROGRESS" } });
    }
    count++;
    await maybeAchieveAndAdvance(goal.id);
  }

  return NextResponse.json({ ok: true, updated: count });
}
