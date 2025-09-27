
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") || "180", 10), 365);
  const outreachId = searchParams.get("outreachId");
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  // fetch activities within range
  const acts = await db.activityLog.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(outreachId ? { person: { outreachId } } : {}),
    },
    select: { date: true },
  });

  // bucket by YYYY-MM-DD (local)
  const counts = new Map<string, number>();
  for (const a of acts) {
    const d = new Date(a.date);
    const key = d.toISOString().slice(0,10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const out: { date: string; count: number }[] = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const key = d.toISOString().slice(0,10);
    out.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return NextResponse.json({ range: { start: start.toISOString(), end: end.toISOString() }, data: out });
}
