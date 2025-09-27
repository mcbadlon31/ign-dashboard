import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { canAccessOutreachId, getEmailFromReq, isAdminEmail } from "@/lib/rbac";

function computeReadiness(progressPct: number, lastActivity: Date | null, streakWeeks: number) {
  const boundedProgress = Math.max(0, Math.min(100, progressPct));
  let recencyScore = 0;
  if (lastActivity) {
    const daysSince = Math.max(0, (Date.now() - lastActivity.getTime()) / 86_400_000);
    recencyScore = Math.max(0, 10 - Math.min(10, Math.floor(daysSince / 3))) * 10;
  }
  const streakScore = Math.max(0, Math.min(8, streakWeeks)) * (100 / 8);
  return Math.round(boundedProgress * 0.7 + recencyScore * 0.2 + streakScore * 0.1);
}

export async function GET(req: NextRequest) {
  const email = await getEmailFromReq(req);
  const orgId = await resolveOrgId();
  const isAdmin = isAdminEmail(email);

  const params = new URL(req.url).searchParams;
  const tagIds = (params.get("tagIds") || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const roleContains = (params.get("roleContains") || "").trim().toLowerCase();
  const statusFilter = (params.get("status") || "").trim().toLowerCase();
  const requestedOutreachId = params.get("outreachId");

  const outreachWhere = orgId ? { orgId } : {};
  const allOutreaches = await db.outreach.findMany({
    where: outreachWhere,
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  let accessibleOutreaches = allOutreaches;
  if (!isAdmin && process.env.DEV_BYPASS_AUTH !== "true") {
    const accessRows = await db.outreachAccess.findMany({
      where: { userEmail: email ?? "" },
      select: { outreachId: true },
    });
    const allowedIds = new Set(accessRows.map(row => row.outreachId));
    accessibleOutreaches = allOutreaches.filter(outreach => allowedIds.has(outreach.id));
  }

  const selectedId =
    requestedOutreachId && accessibleOutreaches.some(outreach => outreach.id === requestedOutreachId)
      ? requestedOutreachId
      : accessibleOutreaches[0]?.id ?? null;

  if (selectedId && !(await canAccessOutreachId(email, selectedId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const personWhere: any = {
    deletedAt: null,
    ...(orgId ? { orgId } : {}),
  };

  if (selectedId) {
    personWhere.outreachId = selectedId;
  } else if (!isAdmin && accessibleOutreaches.length) {
    personWhere.outreachId = { in: accessibleOutreaches.map(outreach => outreach.id) };
  }

  if (tagIds.length) {
    personWhere.tags = { some: { tagId: { in: tagIds } } };
  }

  const [roles, people] = await Promise.all([
    db.role.findMany({ where: { isActive: true }, orderBy: { tier: "asc" } }),
    db.person.findMany({
      where: personWhere,
      include: {
        assignment: { include: { role: true } },
        goalPlans: {
          where: { status: { in: ["PLANNED", "IN_PROGRESS", "ACHIEVED", "DEFERRED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { target: true, milestones: true },
        },
        outreach: { select: { id: true, name: true } },
        activities: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  const mapped = people.map(person => {
    const goal = person.goalPlans[0] ?? null;
    const totalMilestones = goal?.milestones.length ?? 0;
    const completedMilestones = goal ? goal.milestones.filter(m => m.completed).length : 0;
    const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    const lastActivity = person.activities[0]?.date ? new Date(person.activities[0].date) : null;
    const ready =
      goal ? goal.status === "IN_PROGRESS" && totalMilestones > 0 && completedMilestones / totalMilestones >= 0.75 : false;

    return {
      id: person.id,
      name: `${person.fullName}${person.outreach ? ` · ${person.outreach.name}` : ""}`,
      currentRole: person.assignment?.role?.name ?? null,
      goal: goal ? { name: goal.target.name, colorHex: goal.target.colorHex } : null,
      goalStatus: goal?.status ?? null,
      goalId: goal?.id ?? null,
      progress: goal ? `${completedMilestones}/${totalMilestones}` : undefined,
      progressPct,
      ready,
      readinessIndex: computeReadiness(progressPct, lastActivity ?? null, 0),
    };
  });

  let filtered = mapped;
  if (roleContains) {
    filtered = filtered.filter(item => {
      const current = item.currentRole?.toLowerCase() ?? "";
      const goalName = item.goal?.name.toLowerCase() ?? "";
      return current.includes(roleContains) || goalName.includes(roleContains);
    });
  }

  if (statusFilter === "ready") {
    filtered = filtered.filter(item => item.ready);
  } else if (statusFilter === "planned") {
    filtered = filtered.filter(item => item.goalStatus === "PLANNED");
  } else if (statusFilter === "achieved") {
    filtered = filtered.filter(item => item.goalStatus === "ACHIEVED");
  }

  return NextResponse.json({
    roles,
    outreaches: accessibleOutreaches,
    people: filtered,
    selectedId,
  });
}
