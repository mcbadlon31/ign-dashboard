
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { canAccessPersonId, getEmailFromReq } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const email = await getEmailFromReq(req);
  const { searchParams } = new URL(req.url);
  const personId = searchParams.get("personId");
  if (!personId) return NextResponse.json({ error: "personId required" }, { status: 400 });

  const allowed = await canAccessPersonId(email, personId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const goal = await db.goalPlan.findFirst({
    where: { personId, status: { in: ["PLANNED", "IN_PROGRESS"] } },
    orderBy: { createdAt: "desc" },
    include: { milestones: true },
  });
  if (!goal) return NextResponse.json({ error: "no active goal" }, { status: 404 });

  const next = goal.milestones.find(m => !m.completed);
  if (!next) return NextResponse.json({ ok: true, message: "all milestones already completed" });

  await db.milestone.update({ where: { id: next.id }, data: { completed: true } });
  await audit('milestone.completeNext', { userEmail: email, entity:'person', entityId: personId, meta: { milestoneId: next.id } });
  if (goal.status === "PLANNED") {
    await db.goalPlan.update({ where: { id: goal.id }, data: { status: "IN_PROGRESS" } });
  }
  return NextResponse.json({ ok: true });
}
