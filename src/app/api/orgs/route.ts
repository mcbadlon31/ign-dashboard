
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(){
  const rows = await db.org.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest){
  const { name, slug } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  const row = await db.org.create({ data: { name, slug } });
  return NextResponse.json(row, { status: 201 });
}
