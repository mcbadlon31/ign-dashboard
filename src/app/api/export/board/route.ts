
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAccessOutreachId, getEmailFromReq, isAdminEmail } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const email = await getEmailFromReq(req);
  if (!email && process.env.DEV_BYPASS_AUTH !== "true") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const outreachId = searchParams.get("outreachId");

  // scope outreaches
  const isAdmin = isAdminEmail(email);
  let whereOutreach: any = {};
  if (outreachId) {
    const ok = await canAccessOutreachId(email, outreachId);
    if (!ok) return new NextResponse("Forbidden", { status: 403 });
    whereOutreach = { outreachId };
  } else if (!isAdmin && process.env.DEV_BYPASS_AUTH !== "true") {
    const access = await db.outreachAccess.findMany({ where: { userEmail: email ?? "" }, select: { outreachId: true } });
    whereOutreach = { outreachId: { in: access.map(a => a.outreachId) } };
  }

  const peopleDb = await db.person.findMany({
    where: whereOutreach,
    include: {
      assignment: { include: { role: true } },
      goalPlans: {
        where: { status: { in: ["PLANNED", "IN_PROGRESS", "ACHIEVED", "DEFERRED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { target: true, milestones: true },
      },
      outreach: true,
    },
    orderBy: { fullName: "asc" },
  });

  let csv = "Person,Outreach,CurrentRole,GoalRole,Progress,GoalStatus,Ready,Commissioned\n";
  for (const p of peopleDb) {
    const goal = p.goalPlans[0];
    const total = goal ? goal.milestones.length : 0;
    const done = goal ? goal.milestones.filter(m=>m.completed).length : 0;
    const ready = goal ? (goal.status === "IN_PROGRESS" && total>0 && done/total>=0.75) : false;
    const commissioned = goal ? (goal.status === "ACHIEVED" && total>0 && done===total) : false;
    const row = [
      `"${
        p.fullName.replace(/"/g, '""')
      }"`,
      `"${
        (p.outreach?.name ?? "").replace(/"/g, '""')
      }"`,
      `"${
        (p.assignment?.role?.name ?? "").replace(/"/g, '""')
      }"`,
      `"${
        (goal?.target.name ?? "").replace(/"/g, '""')
      }"`,
      total ? `${done}/${total}` : "",
      goal?.status ?? "",
      ready ? "TRUE" : "FALSE",
      commissioned ? "TRUE" : "FALSE",
    ].join(",");
    csv += row + "\n";
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=board.csv",
    },
  });
}
