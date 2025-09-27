
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(){
  const rows = await db.coachLimit.findMany();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest){
  const { coachEmail, limit } = await req.json();
  if (!coachEmail || typeof limit !== 'number') return NextResponse.json({ error: "coachEmail and limit required" }, { status: 400 });
  const row = await db.coachLimit.upsert({ where: { coachEmail }, update: { limit }, create: { coachEmail, limit } });
  return NextResponse.json(row, { status: 201 });
}
