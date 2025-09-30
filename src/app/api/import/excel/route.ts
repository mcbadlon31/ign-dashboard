import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/rbac";
import { resolveOrgId } from "@/lib/org";
import ExcelJS from "exceljs";
import templates from "@/config/role-milestones.json";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { ok, email } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "Select an organization" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buf);

  const months: Record<string,string> = { September: "09", October: "10", November: "11", December: "12" };
  let peopleImported = 0, goalsCreated = 0, milestonesCreated = 0;

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name;
    const rows = worksheetToObjects(worksheet);

    let outreach = await db.outreach.findFirst({ where: { name: sheetName, orgId } });
    if (!outreach) {
      outreach = await db.outreach.create({ data: { name: sheetName, orgId } });
    }

    const headerKeys = rows.length ? Object.keys(rows[0]) : [];
    const currentRoleKey = headerKeys.find(k => /legend|current ?role/i.test(k)) ?? null;

    for (const r of rows) {
      const keys = Object.keys(r);
      if (keys.length === 0) continue;
      const nameKey = keys[0];
      const rawName = (r[nameKey] ?? "").toString().trim();
      if (!rawName) continue;

      let person = await db.person.findFirst({ where: { fullName: rawName, orgId } });
      if (person) {
        person = await db.person.update({ where: { id: person.id }, data: { outreachId: outreach.id } });
      } else {
        person = await db.person.create({ data: { fullName: rawName, outreachId: outreach.id, orgId } });
      }

      let currentRoleName = currentRoleKey ? (r[currentRoleKey] ?? "").toString().trim() : "";
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

      const targetRoleName = (r.TargetRole || r.Goal || "").toString().trim();
      if (targetRoleName) {
        const role = await db.role.findUnique({ where: { name: targetRoleName } });
        if (role) {
          const goal = await db.goalPlan.create({ data: { personId: person.id, targetRoleId: role.id } });
          goalsCreated++;

          const arr: string[] = (templates as any)[role.name] ?? [];
          for (const m of arr) {
            await db.milestone.create({ data: { goalPlanId: goal.id, name: m } });
            milestonesCreated++;
          }
        }
      }

      for (const m of Object.keys(months)) {
        if (String(r[m] || "").trim()) {
          const firstDay = new Date(`2024-${months[m]}-01T00:00:00Z`);
          await db.activityLog.create({
            data: { personId: person.id, month: firstDay, type: "Attendance", notes: `Imported from ${sheetName}/${m}` },
          });
        }
      }
      peopleImported++;
    }
  }

  return NextResponse.json({ ok: true, peopleImported, goalsCreated, milestonesCreated });
}

function worksheetToObjects(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];

  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const header = cell.text?.trim();
    headers[colNumber] = header ?? "";
  });

  const records: Record<string, string>[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    for (let colNumber = 1; colNumber < headers.length; colNumber += 1) {
      const header = headers[colNumber];
      if (!header) continue;
      const cell = row.getCell(colNumber);
      record[header] = cell?.text?.trim() ?? "";
    }
    if (Object.keys(record).length) {
      records.push(record);
    }
  });

  return records;
}

