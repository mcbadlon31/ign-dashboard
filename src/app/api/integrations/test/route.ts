import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/rbac";

async function sendWebhook(url: string, payload: any){
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function POST(req: NextRequest){
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { text = "Hello from IGN" } = await req.json().catch(()=>({}));
  const slack = process.env.SLACK_WEBHOOK_URL;
  const teams = process.env.TEAMS_WEBHOOK_URL;
  const results: any = {};

  if (slack) results.slack = await sendWebhook(slack, { text });
  if (teams) results.teams = await sendWebhook(teams, { text });

  if (!slack && !teams) return NextResponse.json({ error: "No webhooks configured" }, { status: 400 });
  return NextResponse.json({ ok: true, results });
}
