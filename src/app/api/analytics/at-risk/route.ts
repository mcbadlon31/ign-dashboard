
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const soon = new Date(now.getTime() + 30*86400000);

  const acts = await db.activityLog.findMany({ select: { personId: true, date: true } });
  const lastMap = new Map<string, Date>();
  for (const a of acts) {
    const d = new Date(a.date as any);
    const prev = lastMap.get(a.personId);
    if (!prev || d>prev) lastMap.set(a.personId, d);
  }

  const goals = await db.goalPlan.findMany({ where: { status: { in: ["PLANNED","IN_PROGRESS"] } }, include: { milestones: true, person: { include: { outreach: true } }, target: true } });
  const out: any[] = [];
  for (const g of goals) {
    const total = g.milestones.length || 1;
    const done = g.milestones.filter(m=>m.completed).length;
    const pct = Math.round((done/total)*100);
    const last = lastMap.get(g.personId ?? "");
    const inactive30 = !last || ((now.getTime()-last.getTime())> (30*86400000));
    const soonDue = g.targetDate && g.targetDate <= soon;
    if ((soonDue && pct < 25) || inactive30) {
      out.push({
        id: g.person?.id,
        name: g.person?.fullName,
        outreach: g.person?.outreach?.name ?? "",
        goal: g.target?.name ?? "",
        progress: `${done}/${total}`,
        pct,
        reason: inactive30 ? "No activity ≥30d" : "Due ≤30d & <25%",
      });
    }
  }

  return NextResponse.json(out);
}
