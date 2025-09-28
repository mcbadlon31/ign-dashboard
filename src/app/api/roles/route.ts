import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/rbac";

export async function GET() {
  const roles = await db.role.findMany({ orderBy: { tier: "asc" } });
  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { name, tier, colorHex, isActive } = body ?? {};
  if (!name || typeof tier !== "number") {
    return NextResponse.json({ error: "name and tier are required" }, { status: 400 });
  }
  const role = await db.role.create({
    data: { name, tier, colorHex: colorHex ?? "#64748B", isActive: isActive ?? true },
  });
  return NextResponse.json(role, { status: 201 });
}
