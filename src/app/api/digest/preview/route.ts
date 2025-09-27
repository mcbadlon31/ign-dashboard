
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const outreachId = searchParams.get("outreachId") || undefined;
  const where: any = outreachId ? { outreachId } : {};
  const people = await db.person.findMany({
    where,
    include: {
      outreach: true,
      goalPlans: { where: { status: { in: ["PLANNED", "IN_PROGRESS"] } }, orderBy: { createdAt: "desc" }, take: 1, include: { milestones: true, target: true } },
      activities: { orderBy: { date: "desc" }, take: 5 },
    },
    orderBy: { fullName: "asc" }
  });

  const items = people.map(p => {
    const g = p.goalPlans[0];
    const total = g?.milestones.length ?? 0;
    const done = g ? g.milestones.filter(m=>m.completed).length : 0;
    return `<tr>
      <td style="padding:6px;border-bottom:1px solid #eee">${p.fullName}</td>
      <td style="padding:6px;border-bottom:1px solid #eee">${p.outreach?.name ?? ""}</td>
      <td style="padding:6px;border-bottom:1px solid #eee">${g?.target.name ?? ""}</td>
      <td style="padding:6px;border-bottom:1px solid #eee">${done}/${total}</td>
      <td style="padding:6px;border-bottom:1px solid #eee">${p.activities[0]?.date?.toISOString?.().slice(0,10) ?? ""}</td>
    </tr>`;
  }).join("");

  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial">
      <h2>Weekly Digest${outreachId ? " – Outreach" : ""}</h2>
      <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:720px">
        <thead>
          <tr>
            <th align="left" style="padding:6px;border-bottom:2px solid #000">Person</th>
            <th align="left" style="padding:6px;border-bottom:2px solid #000">Outreach</th>
            <th align="left" style="padding:6px;border-bottom:2px solid #000">Goal</th>
            <th align="left" style="padding:6px;border-bottom:2px solid #000">Progress</th>
            <th align="left" style="padding:6px;border-bottom:2px solid #000">Last Activity</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>
    </div>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
