
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "all";

  const goals = await db.goalPlan.findMany({ where: { status: { in: ["PLANNED","IN_PROGRESS"] } }, include: { person: { include: { outreach: true } }, milestones: true } });
  const soon = new Date(Date.now() + 30*86400000);

  const rows = goals.map(g=>{
    const total = g.milestones.length || 1;
    const done = g.milestones.filter(m=>m.completed).length;
    const pct = done/total;
    const atRisk = (g.targetDate && g.targetDate <= soon && pct < 0.25);
    return { person: g.person?.fullName, outreach: g.person?.outreach?.name, pct: Math.round(pct*100), due: g.targetDate ? new Date(g.targetDate).toISOString().slice(0,10) : "" , atRisk };
  }).filter(r=>r.atRisk);

  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial">
      <h2>Alerts Preview (${scope})</h2>
      <ul>
        ${rows.map(r=>`<li>${r.person} • ${r.outreach} — ${r.pct}% (due ${r.due})</li>`).join("")}
      </ul>
    </div>
  `;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
