import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/rbac";

export async function GET(req: NextRequest){
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db.org.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest){
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, slug } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  const row = await db.org.create({ data: { name, slug } });
  return NextResponse.json(row, { status: 201 });
}
