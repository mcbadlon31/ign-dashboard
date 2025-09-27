
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ people: [], tags: [], outreaches: [] });
  const people = await db.person.findMany({ where: { fullName: { contains: q } }, include: { outreach: true }, take: 20 });
  const tags = await db.tag.findMany({ where: { name: { contains: q } }, take: 20 });
  const outreaches = await db.outreach.findMany({ where: { name: { contains: q } }, take: 20 });
  return NextResponse.json({ people, tags, outreaches });
}
