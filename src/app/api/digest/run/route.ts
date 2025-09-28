import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import { assertAdmin } from "@/lib/rbac";
import { buildDigestPreviewHtml } from "@/lib/digest";

export async function POST(req: NextRequest) {
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { simulate = false } = body ?? {};

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || "";
  const transporter = host && user && pass ? nodemailer.createTransport({ host, port, auth: { user, pass } }) : null;

  const rows = await db.outreachAccess.findMany({
    select: { userEmail: true, outreachId: true },
    where: { role: "LEADER" },
  });
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.outreachId || !row.userEmail) continue;
    const list = groups.get(row.outreachId) ?? [];
    list.push(row.userEmail);
    groups.set(row.outreachId, list);
  }

  const sent: Array<Record<string, unknown>> = [];
  for (const [outreachId, emails] of groups) {
    if (!emails.length) continue;
    const html = await buildDigestPreviewHtml(outreachId);
    if (simulate || !transporter) {
      sent.push({ outreachId, emails, simulated: true });
      continue;
    }
    await transporter.sendMail({ from, to: emails.join(","), subject: "IGN Weekly Digest", html });
    sent.push({ outreachId, emails, ok: true });
  }

  return NextResponse.json({ ok: true, sent });
}
