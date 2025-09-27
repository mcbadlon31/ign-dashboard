
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(){
  const tags = await db.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(req: Request){
  const { name, colorHex } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const t = await db.tag.upsert({ where: { name }, update: { colorHex: colorHex ?? null }, create: { name, colorHex: colorHex ?? null } });
  return NextResponse.json(t, { status: 201 });
}
