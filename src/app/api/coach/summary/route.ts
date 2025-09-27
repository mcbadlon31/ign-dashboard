
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

function loadLimits(): Record<string, number> {
  try {
    const p = path.join(process.cwd(), "src", "config", "coach-wip.json");
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch { return { default: 8 }; }
}

function computeReadiness(progressPct: number, lastActivity: Date | null, streakWeeks: number){
  const p = Math.max(0, Math.min(100, progressPct));
  let rec = 0; if (lastActivity) { const days = Math.max(0, (Date.now()- lastActivity.getTime())/86400000); rec = Math.max(0, 10 - Math.min(10, Math.floor(days/3))); rec *= 10; }
  const streak = Math.max(0, Math.min(8, streakWeeks)) * (100/8);
  return Math.round(p*0.7 + rec*0.2 + streak*0.1);
}

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const coach = searchParams.get("coach") || "";
  const limits = loadLimits();
  const defaultLimit = limits.default || 8;
  const limit = (coach && limits[coach]) || defaultLimit;

  // Active goals and at-risk for this coach
  const people = await db.person.findMany({ where: { coachEmail: coach || undefined }, select: { id: true, fullName: true, coachEmail: true } });
  const ids = people.map(p => p.id);
  const goals = await db.goalPlan.findMany({ where: { personId: { in: ids }, status: { in: ["PLANNED","IN_PROGRESS"] } }, include: { milestones: true, target: true, person: true } });
  const now = new Date();
  const soon = new Date(now.getTime() + 30*86400000);

  // last activity by person
  const acts = await db.activityLog.findMany({ where: { personId: { in: ids } }, select: { personId: true, date: true } });
  const lastMap = new Map<string, Date>();
  for (const a of acts) {
    const d = new Date(a.date as any);
    const prev = lastMap.get(a.personId);
    if (!prev || d>prev) lastMap.set(a.personId, d);
  }

  const items = goals.map(g => {
    const total = g.milestones.length || 1;
    const done = g.milestones.filter(m=>m.completed).length;
    const pct = Math.round((done/total)*100);
    const last = lastMap.get(g.personId!) || null;
    const inactive30 = !last || ((now.getTime()-last.getTime())>30*86400000);
    const soonDue = g.targetDate && g.targetDate <= soon;
    const atRisk = (soonDue && pct < 25) || inactive30;
    const rdx = computeReadiness(Math.round(pct), last, 0);
    return {
      personId: g.personId,
      name: g.person?.fullName || "",
      goal: g.target?.name || "",
      pct,
      lastActivity: last?.toISOString() || null,
      status: g.status,
      readinessIndex: rdx,
      atRisk
    };
  });

  const inProgress = items.filter(i => i.status === "IN_PROGRESS").length;
  const overWip = inProgress > limit;

  return NextResponse.json({ coach, limit, inProgress, overWip, items });
}
