
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src", "config", "role-milestones.json");

export async function GET(_req: NextRequest) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return new NextResponse(raw, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=role-milestones.json",
    },
  });
}
