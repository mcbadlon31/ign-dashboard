
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import templates from "@/config/role-milestones.json";
import { canAccessPersonId, getEmailFromReq } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const email = await getEmailFromReq(req);
  const body = await req.json();
  const { personId, targetRoleId, targetDate, rationale } = body ?? {};
  if (!personId || !targetRoleId) return NextResponse.json({ error: "personId and targetRoleId required" }, { status: 400 });

  const allowed = await canAccessPersonId(email, personId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Archive any previous active goals
  await db.goalPlan.updateMany({
    where: { personId, status: { in: ["PLANNED", "IN_PROGRESS"] } },
    data: { status: "DEFERRED" },
  });

  await audit('goal.create', { userEmail: email, entity:'person', entityId: personId, meta: { targetRoleId, targetDate, rationale } });
  const goal = await db.goalPlan.create({
    data: { personId, targetRoleId, targetDate: targetDate ? new Date(targetDate) : null, rationale: rationale ?? "" },
    include: { target: true },
  });

  // @ts-ignore
  const arr: string[] = (templates as any)[goal.target.name] ?? [];
  for (const m of arr) {
    await db.milestone.create({ data: { goalPlanId: goal.id, name: m } });
  }

  return NextResponse.json({ ok: true, goalId: goal.id });
}
