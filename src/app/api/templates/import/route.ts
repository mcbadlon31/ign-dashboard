
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src", "config", "role-milestones.json");

export async function POST(req: NextRequest) {
  const text = await req.text();
  try {
    const obj = JSON.parse(text);
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
