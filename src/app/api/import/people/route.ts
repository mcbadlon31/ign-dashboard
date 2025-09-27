import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

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
  const text = await req.text();
  if (!text) {
    return NextResponse.json({ error: "empty body" }, { status: 400 });
  }

  const rows = parseCSV(text);
  let created = 0;

  for (const row of rows) {
    const fullName = row.name || row.fullName;
    if (!fullName) continue;

    let outreachId: string | null = null;
    if (row.outreach) {
      let outreach = await db.outreach.findFirst({ where: { name: row.outreach } });
      if (!outreach) {
        outreach = await db.outreach.create({ data: { name: row.outreach } });
      }
      outreachId = outreach.id;
    }

    const person = await db.person.create({
      data: { fullName, outreachId, coachEmail: row.coachEmail || null },
    });

    if (row.currentRoleName) {
      const role = await db.role.findFirst({ where: { name: row.currentRoleName } });
      if (role) {
        await db.assignment.create({ data: { personId: person.id, activeRoleId: role.id } });
      }
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

    created += 1;
    await audit("import.person", { entity: "person", entityId: person.id, meta: row });
  }

  return NextResponse.json({ ok: true, created });
}
