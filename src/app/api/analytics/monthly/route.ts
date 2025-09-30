import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type MetricTotals = {
  created: number;
  achieved: number;
  ready: number;
  atRisk: number;
};

type OutreachBucket = MetricTotals & {
  outreachId: string | null;
  outreachName: string;
};

type TimelineMonth = {
  key: string;
  label: string;
  totals: MetricTotals;
  outreach: OutreachBucket[];
};

const MAX_MONTHS = 24;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const monthsParam = Number(url.searchParams.get("months") ?? 6);
  const months = Number.isFinite(monthsParam) ? Math.min(Math.max(1, Math.floor(monthsParam)), MAX_MONTHS) : 6;
  const outreachId = url.searchParams.get("outreachId") || null;

  const now = new Date();
  const startOfCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const monthBuckets: TimelineMonth[] = [];
  const monthIndex = new Map<string, TimelineMonth>();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(startOfCurrentMonth.getUTCFullYear(), startOfCurrentMonth.getUTCMonth() - offset, 1));
    const key = monthKey(date);
    const label = monthLabel(date);

    const bucket: TimelineMonth = {
      key,
      label,
      totals: { created: 0, achieved: 0, ready: 0, atRisk: 0 },
      outreach: [],
    };
    monthBuckets.push(bucket);
    monthIndex.set(key, bucket);
  }

  const earliestMonthStart = monthBuckets[0]?.key ? parseMonthKey(monthBuckets[0].key) : startOfCurrentMonth;

  const goalFilter: any = {
    OR: [
      { createdAt: { gte: earliestMonthStart } },
      { updatedAt: { gte: earliestMonthStart } },
      { targetDate: { gte: earliestMonthStart } },
    ],
  };

  if (outreachId) {
    goalFilter.person = { outreachId };
  }

  const goals = await db.goalPlan.findMany({
    where: goalFilter,
    include: {
      person: { select: { outreachId: true } },
      milestones: { select: { completed: true } },
    },
  });

  const outreachIds = new Set<string>();
  for (const goal of goals) {
    if (goal.person?.outreachId) outreachIds.add(goal.person.outreachId);
  }

  const outreachMap = new Map<string, string>();
  if (outreachIds.size) {
    const outreachRows = await db.outreach.findMany({
      where: { id: { in: Array.from(outreachIds) } },
      select: { id: true, name: true },
    });
    for (const row of outreachRows) {
      outreachMap.set(row.id, row.name);
    }
  }

  const ensureOutreachBucket = (bucket: TimelineMonth, outreachIdValue: string | null, outreachName: string) => {
    let entry = bucket.outreach.find(item => item.outreachId === outreachIdValue);
    if (!entry) {
      entry = {
        outreachId: outreachIdValue,
        outreachName,
        created: 0,
        achieved: 0,
        ready: 0,
        atRisk: 0,
      };
      bucket.outreach.push(entry);
    }
    return entry;
  };

  for (const goal of goals) {
    const goalOutreachId = goal.person?.outreachId ?? null;
    const goalOutreachName = goalOutreachId ? outreachMap.get(goalOutreachId) ?? "Unknown outreach" : "Unassigned";

    const totalMilestones = goal.milestones.length;
    const completedMilestones = goal.milestones.filter(milestone => milestone.completed).length;
    const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    const createdKey = monthKey(goal.createdAt);
    if (monthIndex.has(createdKey)) {
      const bucket = monthIndex.get(createdKey)!;
      bucket.totals.created += 1;
      const outreachBucket = ensureOutreachBucket(bucket, goalOutreachId, goalOutreachName);
      outreachBucket.created += 1;
    }

    if (goal.status === "ACHIEVED") {
      const achievedKey = monthKey(goal.updatedAt ?? goal.createdAt);
      if (monthIndex.has(achievedKey)) {
        const bucket = monthIndex.get(achievedKey)!;
        bucket.totals.achieved += 1;
        const outreachBucket = ensureOutreachBucket(bucket, goalOutreachId, goalOutreachName);
        outreachBucket.achieved += 1;
      }
    }

    if (progressPct >= 75) {
      const readyKey = monthKey(goal.updatedAt ?? goal.createdAt);
      if (monthIndex.has(readyKey)) {
        const bucket = monthIndex.get(readyKey)!;
        bucket.totals.ready += 1;
        const outreachBucket = ensureOutreachBucket(bucket, goalOutreachId, goalOutreachName);
        outreachBucket.ready += 1;
      }
    }

    if (goal.targetDate && progressPct < 25) {
      const riskKey = monthKey(goal.targetDate);
      if (monthIndex.has(riskKey)) {
        const bucket = monthIndex.get(riskKey)!;
        bucket.totals.atRisk += 1;
        const outreachBucket = ensureOutreachBucket(bucket, goalOutreachId, goalOutreachName);
        outreachBucket.atRisk += 1;
      }
    }
  }

  for (const bucket of monthBuckets) {
    bucket.outreach.sort((a, b) => a.outreachName.localeCompare(b.outreachName));
  }

  return NextResponse.json({ months: monthBuckets });
}

function monthKey(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function parseMonthKey(key: string): Date {
  const [yearStr, monthStr] = key.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  return new Date(Date.UTC(year, month, 1));
}
