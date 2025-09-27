import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { audit } from "@/lib/audit";


const filePath = path.join(process.cwd(), "src", "config", "role-milestones.json");

export async function GET() {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  // Expect full object: { [roleName]: string[] }
  const text = JSON.stringify(body, null, 2);
  fs.writeFileSync(filePath, text, "utf-8");
  await audit('templates.update');
  return NextResponse.json({ ok: true });
}
