
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function weekKey(d: Date){ const t = new Date(d); t.setHours(0,0,0,0); const onejan = new Date(t.getFullYear(),0,1); const week = Math.floor((((t as any) - (onejan as any)) / 86400000 + onejan.getDay()+1)/7); return `${t.getFullYear()}-${week}`; }

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const coach = searchParams.get("coach") || "";
  const days = parseInt(searchParams.get("window") || "90", 10);

  const since = new Date(Date.now() - days*86400000);
  const people = await db.person.findMany({ where: { coachEmail: coach || undefined }, select: { id: true } });
  const ids = people.map(p=>p.id);

  const acts = await db.activityLog.findMany({ where: { personId: { in: ids }, date: { gte: since } }, select: { date: true, type: true } });
  const ach = await db.goalPlan.findMany({ where: { personId: { in: ids }, status: "ACHIEVED", updatedAt: { gte: since } }, select: { updatedAt: true } });

  const wk = new Map<string, { followups: number; coaching: number; achieved: number }>();
  function bump(key: string, f: (o:any)=>void){ const o = wk.get(key) || { followups:0, coaching:0, achieved:0 }; f(o); wk.set(key, o); }

  for (const a of acts){
    const k = weekKey(new Date(a.date as any));
    if ((a.type||'').toLowerCase().includes('follow')) bump(k, o=>o.followups++);
    if ((a.type||'').toLowerCase().includes('coach')) bump(k, o=>o.coaching++);
  }
  for (const g of ach){
    const k = weekKey(new Date(g.updatedAt as any));
    bump(k, o=>o.achieved++);
  }
  const series = Array.from(wk, ([k,v]) => ({ week: k, ...v })).sort((a,b)=> a.week.localeCompare(b.week));
  return NextResponse.json(series);
}
