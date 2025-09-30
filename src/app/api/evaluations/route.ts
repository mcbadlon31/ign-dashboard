import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { getEmailFromReq } from "@/lib/rbac";

type Granularity = "month" | "quarter" | "year";

function bucket(date: Date, granularity: Granularity) {
  const year = date.getFullYear();
  if (granularity === "year") return String(year);
  if (granularity === "quarter") {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return year + "-Q" + quarter;
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return year + "-" + month;
}

export async function GET(req: NextRequest) {
  const email = await getEmailFromReq(req);
  const orgId = await resolveOrgId({ email });
  if (!orgId) {
    return NextResponse.json({ error: "No organization access" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const granularity = (searchParams.get("g") as Granularity) || "month";
  const sinceParam = searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));

  const rows = await db.personStage.findMany({
    where: {
      enteredAt: { gte: since },
      person: { orgId },
    },
    select: { stage: true, enteredAt: true },
  });

  const series: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    const bucketKey = bucket(new Date(row.enteredAt), granularity);
    const stageKey = row.stage as string;
    if (!series[bucketKey]) series[bucketKey] = {};
    series[bucketKey][stageKey] = (series[bucketKey][stageKey] || 0) + 1;
  }

  return NextResponse.json({ granularity, series });
}
