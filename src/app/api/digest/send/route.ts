import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { assertAdmin } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { to, subject = "IGN Weekly Digest", html } = body ?? {};
  if (!to || !html) return NextResponse.json({ error: "to and html required" }, { status: 400 });

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.log("SMTP not configured; would send to:", to);
    return NextResponse.json({ ok: true, simulated: true });
  }

  const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
  await transporter.sendMail({ from: process.env.SMTP_FROM || user, to, subject, html });
  return NextResponse.json({ ok: true });
}
