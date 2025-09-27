
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}));
  const { simulate = false } = body ?? {};

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || "";
  const transporter = (host && user && pass) ? nodemailer.createTransport({ host, port, auth: { user, pass } }) : null;

  // Leaders by outreach
  const rows = await db.outreachAccess.findMany({ select: { userEmail: true, outreachId: true }, where: { role: "LEADER" } });
  const groups = new Map<string, string[]>(); // outreachId -> emails
  for (const r of rows) {
    if (!r.outreachId || !r.userEmail) continue;
    const arr = groups.get(r.outreachId) ?? [];
    arr.push(r.userEmail);
    groups.set(r.outreachId, arr);
  }

  const sent: any[] = [];
  for (const [outreachId, emails] of groups) {
    const previewRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/digest/preview?outreachId=${outreachId}`);
    const html = await previewRes.text();
    if (simulate || !transporter) {
      sent.push({ outreachId, emails, simulated: true });
      continue;
    }
    await transporter.sendMail({ from, to: emails.join(","), subject: "IGN Weekly Digest", html });
    sent.push({ outreachId, emails, ok: true });
  }

  return NextResponse.json({ ok: true, sent });
}
