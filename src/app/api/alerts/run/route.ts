
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest){
  const body = await req.json().catch(()=>({}));
  const simulate = !!body.simulate;

  // Build alerts
  const soon = new Date(Date.now() + 30*86400000);
  const goals = await db.goalPlan.findMany({ where: { status: { in: ["PLANNED","IN_PROGRESS"] } }, include: { person: { include: { outreach: true } }, milestones: true } });

  const atRisk = goals.map(g=>{
    const total = g.milestones.length || 1;
    const done = g.milestones.filter(m=>m.completed).length;
    const pct = done/total;
    return { g, pct, atRisk: (g.targetDate && g.targetDate <= soon && pct < 0.25) };
  }).filter(x=>x.atRisk);

  // Group by outreach owner (fallback to coachEmail later if available)
  const groups = new Map<string, any[]>();
  for (const x of atRisk){
    const key = x.g.person?.outreach?.name || "General";
    const arr = groups.get(key) || [];
    arr.push(x);
    groups.set(key, arr);
  }

  // Compose HTML per group
  const payloads: { key: string; html: string }[] = [];
  for (const [key, list] of groups){
    const html = `<div style="font-family:system-ui"><h3>At-Risk (${key})</h3><ul>` + list.map(x=>{
      const due = x.g.targetDate ? new Date(x.g.targetDate).toISOString().slice(0,10) : "";
      return `<li>${x.g.person?.fullName} • ${Math.round(x.pct*100)}% (due ${due})</li>`;
    }).join("") + "</ul></div>";
    payloads.push({ key, html });
  }

  if (simulate){
    for (const p of payloads){
      await db.alertLog.create({ data: { type: "preview", scope: p.key, payload: p.html } });
    }
    return NextResponse.json({ ok: true, simulated: true, count: payloads.length });
  }

  // Send via SMTP if configured
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || "";

  if (!host || !user || !pass){
    // fallback: store in AlertLog
    for (const p of payloads){
      await db.alertLog.create({ data: { type: "atrisk", scope: p.key, payload: p.html } });
    }
    return NextResponse.json({ ok: true, stored: payloads.length });
  }

  const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
  for (const p of payloads){
    await transporter.sendMail({ from, to: from, subject: `IGN Alerts: ${p.key}`, html: p.html });
    await db.alertLog.create({ data: { type: "atrisk", scope: p.key } });
  }
  return NextResponse.json({ ok: true, sent: payloads.length });
}
