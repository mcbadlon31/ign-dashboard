import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { assertAdmin } from "@/lib/rbac";

const filePath = path.join(process.cwd(), "src", "config", "role-milestones.json");

export async function GET(req: NextRequest) {
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const raw = fs.readFileSync(filePath, "utf-8");
  return new NextResponse(raw, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=role-milestones.json",
    },
  });
}
