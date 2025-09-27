import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";
import templates from "@/config/role-milestones.json";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const monthMap: Record<string, string> = {
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  };

  let peopleImported = 0;
  let goalsCreated = 0;
  let milestonesCreated = 0;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    let outreach = await db.outreach.findFirst({ where: { name: sheetName } });
    if (!outreach) {
      outreach = await db.outreach.create({ data: { name: sheetName } });
    }

    const headerKeys = rows.length ? Object.keys(rows[0]) : [];
    const currentRoleKey = headerKeys.find(key => /legend|current ?role/i.test(key)) ?? null;

    for (const row of rows) {
      const columns = Object.keys(row);
      if (columns.length === 0) continue;

      const nameCell = columns[0];
      const rawName = String(row[nameCell] ?? "").trim();
      if (!rawName) continue;

      let person = await db.person.findFirst({ where: { fullName: rawName } });
      if (person) {
        person = await db.person.update({ where: { id: person.id }, data: { outreachId: outreach.id } });
      } else {
        person = await db.person.create({ data: { fullName: rawName, outreachId: outreach.id } });
      }

      const currentRoleName = currentRoleKey ? String(row[currentRoleKey] ?? "").trim() : "";
      if (currentRoleName) {
        const role = await db.role.findUnique({ where: { name: currentRoleName } });
        if (role) {
          await db.assignment.upsert({
            where: { personId: person.id },
            update: { outreachId: outreach.id, activeRoleId: role.id },
            create: { personId: person.id, outreachId: outreach.id, activeRoleId: role.id },
          });
        }
      } else {
        await db.assignment.upsert({
          where: { personId: person.id },
          update: { outreachId: outreach.id },
          create: { personId: person.id, outreachId: outreach.id },
        });
      }

      const targetRoleName = String(row.TargetRole ?? row.Goal ?? "").trim();
      if (targetRoleName) {
        const role = await db.role.findUnique({ where: { name: targetRoleName } });
        if (role) {
          const goal = await db.goalPlan.create({ data: { personId: person.id, targetRoleId: role.id } });
          goalsCreated += 1;

          const milestones: string[] = (templates as Record<string, string[]>)[role.name] ?? [];
          for (const milestone of milestones) {
            await db.milestone.create({ data: { goalPlanId: goal.id, name: milestone } });
            milestonesCreated += 1;
          }
        }
      }

      for (const month of Object.keys(monthMap)) {
        if (String(row[month] ?? "").trim()) {
          const monthDate = new Date(`2024-${monthMap[month]}-01T00:00:00Z`);
          await db.activityLog.create({
            data: {
              personId: person.id,
              month: monthDate,
              type: "Attendance",
              notes: `Imported from ${sheetName}/${month}`,
            },
          });
        }
      }

      peopleImported += 1;
    }
  }

  return NextResponse.json({ ok: true, peopleImported, goalsCreated, milestonesCreated });
}
