import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { resolveOrgId } from "@/lib/org";
import { getEmailFromReq, isAdminEmail } from "@/lib/rbac";
import { computeWeeklyStreak } from "@/lib/activity-stats";

const COACH_LIMIT_CACHE: { value: Record<string, number> | null; mtimeMs: number | null } = {
  value: null,
  mtimeMs: null,
};

function loadLimits(): Record<string, number> {
  try {
    const filePath = path.join(process.cwd(), "src", "config", "coach-wip.json");
    const stat = fs.statSync(filePath);
    if (!COACH_LIMIT_CACHE.value || COACH_LIMIT_CACHE.mtimeMs !== stat.mtimeMs) {
      COACH_LIMIT_CACHE.value = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      COACH_LIMIT_CACHE.mtimeMs = stat.mtimeMs;
    }
    return COACH_LIMIT_CACHE.value ?? { default: 8 };
  } catch {
    return COACH_LIMIT_CACHE.value ?? { default: 8 };
  }
}

function computeReadiness(progressPct: number, lastActivity: Date | null, streakWeeks: number) {
  const p = Math.max(0, Math.min(100, progressPct));
  let rec = 0;
  if (lastActivity) {
    const days = Math.max(0, (Date.now() - lastActivity.getTime()) / 86_400_000);
    rec = Math.max(0, 10 - Math.min(10, Math.floor(days / 3))) * 10;
  }
  const streak = Math.max(0, Math.min(8, streakWeeks)) * (100 / 8);
  return Math.round(p * 0.7 + rec * 0.2 + streak * 0.1);
}

export async function GET(req: NextRequest) {
  const bypass = process.env.DEV_BYPASS_AUTH === "true";
  const email = await getEmailFromReq(req);
  if (!bypass && !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "No organization access" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const coach = searchParams.get("coach") || "";

  if (!bypass && email && coach && email.toLowerCase() !== coach.toLowerCase() && !isAdminEmail(email)) {
    // non-admins can only view their own coaching summary
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limits = loadLimits();
  const defaultLimit = limits.default || 8;
  const limit = (coach && limits[coach]) || defaultLimit;

  const people = await db.person.findMany({
    where: {
      orgId,
      ...(coach ? { coachEmail: coach } : {}),
    },
    select: { id: true, fullName: true, coachEmail: true },
  });

  const ids = people.map(person => person.id);
  if (!ids.length) {
    return NextResponse.json({ coach, limit, inProgress: 0, overWip: false, items: [] });
  }

  const goals = await db.goalPlan.findMany({
    where: { personId: { in: ids }, status: { in: ["PLANNED", "IN_PROGRESS"] } },
    include: { milestones: true, target: true, person: true },
  });
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 86_400_000);

  const activities = await db.activityLog.findMany({
    where: { personId: { in: ids }, date: { gte: new Date(now.getTime() - 56 * 86_400_000) } },
    select: { personId: true, date: true },
  });

  const streakMap = computeWeeklyStreak(activities);
  const lastMap = new Map<string, Date>();
  for (const activity of activities) {
    const date = new Date(activity.date as any);
    const previous = lastMap.get(activity.personId);
    if (!previous || date > previous) {
      lastMap.set(activity.personId, date);
    }
  }

  const items = goals.map(goal => {
    const total = goal.milestones.length || 1;
    const done = goal.milestones.filter(m => m.completed).length;
    const pct = Math.round((done / total) * 100);
    const last = lastMap.get(goal.personId) || null;
    const streakWeeks = streakMap.get(goal.personId) ?? 0;
    const inactive30 = !last || now.getTime() - last.getTime() > 30 * 86_400_000;
    const soonDue = goal.targetDate && goal.targetDate <= soon;
    const atRisk = (soonDue && pct < 25) || inactive30;
    const readinessIndex = computeReadiness(pct, last, streakWeeks);
    return {
      personId: goal.personId,
      name: goal.person?.fullName || "",
      goal: goal.target?.name || "",
      pct,
      lastActivity: last?.toISOString() || null,
      status: goal.status,
      readinessIndex,
      streakWeeks,
      atRisk,
    };
  });

  const inProgress = items.filter(item => item.status === "IN_PROGRESS").length;
  const overWip = inProgress > limit;

  return NextResponse.json({ coach, limit, inProgress, overWip, items });
}
