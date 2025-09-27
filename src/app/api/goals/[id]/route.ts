import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

type PatchBody = {
  data?: {
    targetRoleId?: string;
    targetDate?: string | null;
    status?: string;
  };
  migrateToVersionId?: string;
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as PatchBody;
  const updates: Record<string, unknown> = {};
  if (body.data?.targetRoleId) updates.targetRoleId = body.data.targetRoleId;
  if ("targetDate" in (body.data ?? {})) {
    updates.targetDate = body.data?.targetDate ? new Date(body.data.targetDate) : null;
  }
  if (body.data?.status) updates.status = body.data.status;

  if (body.migrateToVersionId) {
    const templateVersion = await db.roleTemplateVersion.findUnique({
      where: { id: body.migrateToVersionId },
    });
    if (!templateVersion) {
      return NextResponse.json({ error: "template version not found" }, { status: 404 });
    }

    const goal = await db.goalPlan.findUnique({
      where: { id: params.id },
      include: { milestones: true },
    });
    if (!goal) {
      return NextResponse.json({ error: "goal not found" }, { status: 404 });
    }

    const existing = goal.milestones;
    const nextMilestones = Array.isArray(templateVersion.milestonesJson)
      ? (templateVersion.milestonesJson as Array<{ title?: string; name?: string } | string>).map(item => {
          const label =
            typeof item === "string"
              ? item
              : item.title ?? item.name ?? "Untitled milestone";
          return { name: String(label), completed: false };
        })
      : [];

    for (const milestone of nextMilestones) {
      const match = existing.find(current => current.name.toLowerCase() === milestone.name.toLowerCase());
      if (match) {
        milestone.completed = match.completed;
      }
    }

    await db.$transaction(async tx => {
      await tx.milestone.deleteMany({ where: { goalPlanId: params.id } });
      for (const milestone of nextMilestones) {
        await tx.milestone.create({
          data: {
            goalPlanId: params.id,
            name: milestone.name,
            completed: milestone.completed,
          },
        });
      }
      await tx.goalPlan.update({
        where: { id: params.id },
        data: { templateVersionId: templateVersion.id },
      });
    });

    await audit("goal.migrateVersion", {
      entity: "goal",
      entityId: params.id,
      meta: { templateVersionId: templateVersion.id },
    });

    return NextResponse.json({ ok: true, migrated: nextMilestones.length });
  }

  if (Object.keys(updates).length > 0) {
    const updated = await db.goalPlan.update({ where: { id: params.id }, data: updates });
    await audit("goal.update", { entity: "goal", entityId: params.id, meta: updates });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ ok: true });
}
