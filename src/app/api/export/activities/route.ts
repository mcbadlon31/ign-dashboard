
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEmailFromReq, canAccessOutreachId, canAccessPersonId, isAdminEmail } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const email = await getEmailFromReq(req);
  if (!email && process.env.DEV_BYPASS_AUTH !== "true") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const outreachId = searchParams.get("outreachId");
  const personId = searchParams.get("personId");
  const days = Math.min(parseInt(searchParams.get("days") || "90", 10), 365);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);

  if (personId) {
    const ok = await canAccessPersonId(email, personId);
    if (!ok) return new NextResponse("Forbidden", { status: 403 });
  } else if (outreachId) {
    const ok = await canAccessOutreachId(email, outreachId);
    if (!ok) return new NextResponse("Forbidden", { status: 403 });
  }

  let where: any = { date: { gte: start, lte: end } };
  if (personId) where.personId = personId;
  if (outreachId) where.person = { outreachId };

  const acts = await db.activityLog.findMany({
    where,
    include: { person: { select: { fullName: true, outreach: { select: { name: true } } } } },
    orderBy: { date: "desc" },
  });

  let csv = "Date,Person,Outreach,Type,Notes\n";
  for (const a of acts) {
    const row = [
      new Date(a.date).toISOString().slice(0,10),
      `"${
        a.person?.fullName?.replace(/"/g, '""') ?? ""
      }"`,
      `"${
        a.person?.outreach?.name?.replace(/"/g, '""') ?? ""
      }"`,
      a.type ?? "",
      `"${
        (a.notes ?? "").replace(/"/g, '""')
      }"`
    ].join(",");
    csv += row + "\n";
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=activities.csv",
    },
  });
}
