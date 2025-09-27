
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(){
  // Compute IN_PROGRESS goal counts per coach, suggest moving from over-cap to under-cap
  const people = await db.person.findMany({ select: { id: true, fullName: true, coachEmail: true } });
  const goals = await db.goalPlan.findMany({ where: { status: { in: ["PLANNED","IN_PROGRESS"] } }, select: { personId: true, status: true } });
  const limitRows = await db.coachLimit.findMany();
  const limitMap = new Map<string, number>(limitRows.map(r=>[r.coachEmail, r.limit]));
  const byCoach = new Map<string, { ids: string[], limit: number }>();

  const activeIds = new Set(goals.filter(g=>g.status==='IN_PROGRESS').map(g=>g.personId));
  for (const p of people){
    const c = p.coachEmail || "unassigned";
    const obj = byCoach.get(c) || { ids: [], limit: limitMap.get(c) || 8 };
    if (activeIds.has(p.id)) obj.ids.push(p.id);
    byCoach.set(c, obj);
  }

  const over: { coach: string; ids: string[]; overBy: number }[] = [];
  const under: { coach: string; slots: number }[] = [];
  for (const [coach, { ids, limit }] of byCoach){
    if (ids.length > limit) over.push({ coach, ids, overBy: ids.length - limit });
    if (ids.length < limit) under.push({ coach, slots: limit - ids.length });
  }
  // simple greedy suggestions
  const suggestions: any[] = [];
  for (const o of over){
    let need = o.overBy;
    for (const u of under){
      if (need<=0) break;
      if (u.slots<=0 || u.coach===o.coach) continue;
      const take = Math.min(need, u.slots);
      const moveIds = o.ids.splice(0, take);
      suggestions.push({ from: o.coach, to: u.coach, personIds: moveIds });
      need -= take; u.slots -= take;
    }
  }
  return NextResponse.json({ suggestions });
}
