
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { slug: string }}){
  const v = await db.savedView.findUnique({ where: { slug: params.slug } });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const f: any = v.filters || {};
  const outreachId = v.outreachId || undefined;

  // Fetch board-like payload but with tag filtering
  const people = await db.person.findMany({
    where: {
      ...(outreachId ? { outreachId } : {}),
      deletedAt: null,
      ...(Array.isArray(f.tagIds) && f.tagIds.length ? {
        tags: { some: { tagId: { in: f.tagIds as string[] } } }
      } : {})
    },
    include: {
      outreach: true,
      assignment: { include: { role: true } },
      goalPlans: { where: { status: { in: ["PLANNED","IN_PROGRESS"] } }, orderBy: { createdAt: "desc" }, take: 1, include: { target: true, milestones: true } }
    },
    orderBy: { fullName: "asc" }
  });

  const mapped = people.map(p => {
    const goal = p.goalPlans[0];
    const total = goal?.milestones.length || 0;
    const done = goal ? goal.milestones.filter(m=>m.completed).length : 0;
    const ready = total>0 ? (done/total)>=0.75 : false;
    return {
      id: p.id,
      name: `${p.fullName}${p.outreach ? " • " + p.outreach.name : ""}`,
      currentRole: p.assignment?.role?.name ?? null,
      goal: goal ? { name: goal.target?.name ?? "", progress: `${done}/${total}` } : null,
      ready
    };
  });

  return NextResponse.json({ people: mapped, outreachId });
}
