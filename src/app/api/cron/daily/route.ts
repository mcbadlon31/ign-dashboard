import { NextRequest, NextResponse } from "next/server";
import { runAlertsJob } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest){
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const provided = req.headers.get("x-ign-cron-secret");
  if (provided !== expected) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await runAlertsJob({ simulate: false });
  return NextResponse.json({ ok: true, ...result });
}
