
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(){
  const people = await db.person.findMany({ include: { outreach: true } });
  const map = new Map<string, any[]>();
  for (const p of people) {
    const key = (p.fullName || "").trim().toLowerCase();
    if (!key) continue;
    const arr = map.get(key) || [];
    arr.push(p);
    map.set(key, arr);
  }
  const dups = Array.from(map.values()).filter(arr => arr.length > 1);
  return NextResponse.json(dups);
}
