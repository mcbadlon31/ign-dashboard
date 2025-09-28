import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/rbac";
import { runAlertsJob } from "@/lib/alerts";

export async function POST(req: NextRequest){
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const result = await runAlertsJob({ simulate: !!body.simulate });
  return NextResponse.json({ ok: true, ...result });
}
