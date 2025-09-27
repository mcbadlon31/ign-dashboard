
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function icsEscape(s: string){
  return s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
}

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const outreachId = searchParams.get("outreachId");
  const personId = searchParams.get("personId");

  let where: any = { targetDate: { not: null } };
  if (personId) where.personId = personId;
  if (outreachId) where.person = { outreachId };

  const goals = await db.goalPlan.findMany({ where, include: { person: true, target: true } });

  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//IGN Trajectory//EN\n";
  for (const g of goals) {
    if (!g.targetDate) continue;
    const dt = new Date(g.targetDate);
    const dtStr = dt.toISOString().replace(/[-:]/g,'').split('.')[0] + "Z";
    const summary = icsEscape(`[IGN] ${g.person?.fullName || ""} → ${g.target?.name || "Goal"}`);
    const uid = `ign-${g.id}@ign.local`;
    ics += `BEGIN:VEVENT\nUID:${uid}\nDTSTAMP:${dtStr}\nDTSTART:${dtStr}\nSUMMARY:${summary}\nEND:VEVENT\n`;
  }
  ics += "END:VCALENDAR\n";

  return new NextResponse(ics, { status: 200, headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "attachment; filename=ign-targets.ics" } });
}
