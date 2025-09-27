
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const goals = await db.goalPlan.findMany({
    where: { status: { in: ["PLANNED", "IN_PROGRESS"] } },
    include: { target: true, milestones: true },
  });

  const pipelineCounts: Record<string, number> = {};
  for (const g of goals) pipelineCounts[g.target.name] = (pipelineCounts[g.target.name] ?? 0) + 1;

  const now = new Date();
  const within30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  let readyCount = 0;
  for (const g of goals) {
    if (g.status !== "IN_PROGRESS") continue;
    const total = g.milestones.length || 1;
    const done = g.milestones.filter(m => m.completed).length;
    const pct = done / total;
    const td = g.targetDate ?? within30;
    if (pct >= 0.75 && td <= within30) readyCount++;
  }

  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const recent = await db.activityLog.findMany({ where: { date: { gte: twoWeeksAgo } }, select: { personId: true } });
  const activeIds = new Set(recent.map(r => r.personId));
  const totalPeople = await db.person.count();
  const uncovered = totalPeople - activeIds.size;

  let csv = "Metric,Value\n";
  csv += `ReadinessReadyCount,${readyCount}\n`;
  csv += `FollowupUncovered,${uncovered}\n`;
  csv += `TotalPeople,${totalPeople}\n`;
  csv += `ActiveGoals,${goals.length}\n`;
  csv += "\nPipelineRole,Count\n";
  for (const [role, count] of Object.entries(pipelineCounts)) {
    csv += `${role},${count}\n`;
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=analytics.csv",
    },
  });
}
