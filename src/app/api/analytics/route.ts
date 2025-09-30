import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { getEmailFromReq } from "@/lib/rbac";
import { computeWeeklyStreak } from "@/lib/activity-stats";

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
  const orgId = await resolveOrgId({ email });
  if (!orgId) {
    return NextResponse.json({ error: "No organization access" }, { status: 403 });
  }

  const goalWhere: any = { status: { in: ["PLANNED", "IN_PROGRESS", "ACHIEVED", "DEFERRED"] }, person: { orgId } };
  const goals = await db.goalPlan.findMany({
    where: goalWhere,
    include: { target: true, milestones: true, person: { select: { id: true, fullName: true, coachEmail: true } } },
  });

  const pipelineByRole = new Map<string, number>();
  const buckets: Record<string, number> = {
    "0-25%": 0,
    "25-50%": 0,
    "50-75%": 0,
    "75-99%": 0,
    "100%": 0,
  };

  const coachLoads = new Map<string, number>();
  for (const goal of goals) {
    pipelineByRole.set(goal.target.name, (pipelineByRole.get(goal.target.name) ?? 0) + 1);
    const total = goal.milestones.length || 1;
    const completed = goal.milestones.filter(m => m.completed).length;
    const pct = Math.round((completed / total) * 100);
    if (pct === 100) buckets["100%"]++;
    else if (pct >= 75) buckets["75-99%"]++;
    else if (pct >= 50) buckets["50-75%"]++;
    else if (pct >= 25) buckets["25-50%"]++;
    else buckets["0-25%"]++;

    if (goal.person?.coachEmail) {
      const coach = goal.person.coachEmail;
      coachLoads.set(coach, (coachLoads.get(coach) ?? 0) + 1);
    }
  }

  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const streakWindow = new Date(now.getTime() - 56 * 86_400_000);

  const activityWhere: any = { date: { gte: streakWindow }, person: { orgId } };
  const recentActivities = await db.activityLog.findMany({
    where: activityWhere,
    orderBy: { date: "desc" },
    select: { personId: true, date: true, type: true },
  });

  const streakMap = computeWeeklyStreak(recentActivities);
  const lastActivityMap = new Map<string, Date>();
  const activityTypeCounts = new Map<string, number>();
  const activeWithin14Days = new Set<string>();

  for (const activity of recentActivities) {
    const date = new Date(activity.date as any);
    if (date >= twoWeeksAgo) {
      activeWithin14Days.add(activity.personId);
    }
    const previous = lastActivityMap.get(activity.personId);
    if (!previous || date > previous) {
      lastActivityMap.set(activity.personId, date);
    }
    if (date >= thirtyDaysAgo) {
      activityTypeCounts.set(activity.type, (activityTypeCounts.get(activity.type) ?? 0) + 1);
    }
  }

  const personWhere: any = { deletedAt: null, orgId };
  const totalPeople = await db.person.count({ where: personWhere });
  const uncovered = Math.max(0, totalPeople - activeWithin14Days.size);

  const thirtyDaysAhead = new Date(now.getTime() + 30 * 86_400_000);
  let readyCount = 0;
  let atRisk = 0;
  let readinessSum = 0;
  let readinessCount = 0;
  const readinessList: Array<{ personId: string; name: string; readinessIndex: number; streakWeeks: number }> = [];

  for (const goal of goals) {
    const total = goal.milestones.length || 1;
    const completed = goal.milestones.filter(m => m.completed).length;
    const pct = completed / total;
    const pctRounded = Math.round(pct * 100);
    const lastActivity = goal.person ? lastActivityMap.get(goal.person.id) ?? null : null;
    const streakWeeks = goal.person ? streakMap.get(goal.person.id) ?? 0 : 0;

    if (goal.status === "IN_PROGRESS" && total > 0 && completed / total >= 0.75) {
      readyCount++;
    }

    const inactive30 = !lastActivity || now.getTime() - lastActivity.getTime() > 30 * 86_400_000;
    if ((goal.targetDate && goal.targetDate <= thirtyDaysAhead && pct < 0.25) || inactive30) {
      atRisk++;
    }

    if (goal.person) {
      const readinessIndex = computeReadiness(pctRounded, lastActivity, streakWeeks);
      readinessSum += readinessIndex;
      readinessCount += 1;
      readinessList.push({
        personId: goal.person.id,
        name: goal.person.fullName ?? goal.person.id,
        readinessIndex,
        streakWeeks,
      });
    }
  }

  return NextResponse.json({
    pipeline: Array.from(pipelineByRole, ([role, count]) => ({ role, count })),
    completionBuckets: Object.entries(buckets).map(([range, count]) => ({ range, count })),
    readinessReadyCount: readyCount,
    readinessIndexAvg: readinessCount ? Math.round(readinessSum / readinessCount) : 0,
    readinessTop3: readinessList.sort((a, b) => b.readinessIndex - a.readinessIndex).slice(0, 3),
    atRiskCount: atRisk,
    followupUncovered: uncovered,
    totals: { goals: goals.length, people: totalPeople },
    coachLoads: Array.from(coachLoads, ([coach, count]) => ({ coach, count })),
    activityTypeCounts: Array.from(activityTypeCounts, ([type, count]) => ({ type, count })),
  });
}
