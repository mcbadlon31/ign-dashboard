import nodemailer from "nodemailer";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

type RunAlertsOptions = {
  simulate?: boolean;
};

type RunAlertsResult =
  | { status: "noop"; count: number }
  | { status: "simulated" | "stored" | "sent"; count: number };

type GoalWithRelations = Prisma.GoalPlanGetPayload<{
  include: { person: { include: { outreach: true } }; milestones: true };
}>;

type AlertEntry = {
  goal: GoalWithRelations;
  pct: number;
};

export async function runAlertsJob(options: RunAlertsOptions = {}): Promise<RunAlertsResult> {
  const simulate = !!options.simulate;
  const soon = new Date(Date.now() + 30 * 86_400_000);

  const goals = (await db.goalPlan.findMany({
    where: { status: { in: ["PLANNED", "IN_PROGRESS"] } },
    include: { person: { include: { outreach: true } }, milestones: true },
  })) as GoalWithRelations[];

  const entries: AlertEntry[] = goals
    .map(goal => {
      const total = goal.milestones.length || 1;
      const done = goal.milestones.filter(milestone => milestone.completed).length;
      const pct = done / total;
      const dueSoon = goal.targetDate && goal.targetDate <= soon;
      const stale = pct < 0.25;
      return { goal, pct, dueSoon, stale };
    })
    .filter(item => item.dueSoon && item.stale)
    .map(item => ({ goal: item.goal, pct: item.pct }));

  if (entries.length === 0) {
    return { status: "noop", count: 0 };
  }

  const groups = new Map<string, AlertEntry[]>();
  for (const entry of entries) {
    const key = entry.goal.person?.outreach?.name || "General";
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }

  const payloads = Array.from(groups, ([key, list]) => {
    const html =
      `<div style="font-family:system-ui"><h3>At-Risk (${key})</h3><ul>` +
      list
        .map(item => {
          const due = item.goal.targetDate ? new Date(item.goal.targetDate).toISOString().slice(0, 10) : "";
          return `<li>${item.goal.person?.fullName} - ${Math.round(item.pct * 100)}% (due ${due})</li>`;
        })
        .join("") +
      "</ul></div>";
    return { key, html };
  });

  if (simulate) {
    for (const payload of payloads) {
      await db.alertLog.create({ data: { type: "preview", scope: payload.key, payload: payload.html } });
    }
    return { status: "simulated", count: payloads.length };
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || "";

  if (!host || !user || !pass) {
    for (const payload of payloads) {
      await db.alertLog.create({ data: { type: "atrisk", scope: payload.key, payload: payload.html } });
    }
    return { status: "stored", count: payloads.length };
  }

  const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
  for (const payload of payloads) {
    await transporter.sendMail({ from, to: from, subject: `IGN Alerts: ${payload.key}`, html: payload.html });
    await db.alertLog.create({ data: { type: "atrisk", scope: payload.key } });
  }
  return { status: "sent", count: payloads.length };
}
