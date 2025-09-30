import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertAdmin } from "@/lib/rbac";
import { resolveOrgId } from "@/lib/org";

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [] as Array<Record<string, string>>;
  const [header, ...rows] = lines;
  const columns = header.split(",").map(column => column.trim());
  return rows.map(line => {
    const parts = line.split(",");
    const record: Record<string, string> = {};
    columns.forEach((column, index) => {
      record[column] = (parts[index] ?? "").trim();
    });
    return record;
  });
}

export async function POST(req: NextRequest) {
  const { ok, email } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "Select an organization" }, { status: 400 });

  const text = await req.text();
  if (!text) return NextResponse.json({ error: "empty body" }, { status: 400 });
  const rows = parseCSV(text);
  let created = 0;

  for (const row of rows) {
    const fullName = row.name || row.fullName;
    if (!fullName) continue;

    let outreachId: string | null = null;
    if (row.outreach) {
      let outreach = await db.outreach.findFirst({ where: { name: row.outreach, orgId } });
      if (!outreach) {
        outreach = await db.outreach.create({ data: { name: row.outreach, orgId } });
      }
      outreachId = outreach.id;
    }

    let person = await db.person.findFirst({ where: { fullName, orgId } });
    if (person) {
      person = await db.person.update({ where: { id: person.id }, data: { outreachId, coachEmail: row.coachEmail || null } });
    } else {
      person = await db.person.create({ data: { fullName, outreachId, coachEmail: row.coachEmail || null, orgId } });
      created += 1;
    }

    if (row.currentRoleName) {
      const role = await db.role.findFirst({ where: { name: row.currentRoleName } });
      if (role) {
        await db.assignment.upsert({
          where: { personId: person.id },
          update: { activeRoleId: role.id, outreachId },
          create: { personId: person.id, activeRoleId: role.id, outreachId },
        });
      }
    } else if (outreachId) {
      await db.assignment.upsert({
        where: { personId: person.id },
        update: { outreachId },
        create: { personId: person.id, outreachId },
      });
    }

    if (row.goalTargetRoleName) {
      const role = await db.role.findFirst({ where: { name: row.goalTargetRoleName } });
      if (role) {
        const targetDate = row.targetDate ? new Date(row.targetDate) : null;
        await db.goalPlan.create({
          data: {
            personId: person.id,
            targetRoleId: role.id,
            targetDate: targetDate ?? undefined,
            status: "PLANNED",
          },
        });
      }
    }

    await audit("import.person", { entity: "person", entityId: person.id, meta: row });
  }

  return NextResponse.json({ ok: true, created });
}

