
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const roleId = searchParams.get("roleId");
  if (!roleId) return NextResponse.json({ error: "roleId required" }, { status: 400 });
  const rows = await db.roleTemplateVersion.findMany({ where: { roleId }, orderBy: { version: "desc" } });
  return NextResponse.json(rows);
}
