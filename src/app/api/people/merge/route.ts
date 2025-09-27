
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest){
  const body = await req.json();
  const { sourceId, targetId } = body ?? {};
  if (!sourceId || !targetId || sourceId === targetId) {
    return NextResponse.json({ error: "sourceId and targetId required (must be different)" }, { status: 400 });
  }

  const [src, tgt] = await Promise.all([
    db.person.findUnique({ where: { id: sourceId } }),
    db.person.findUnique({ where: { id: targetId } }),
  ]);
  if (!src || !tgt) return NextResponse.json({ error: "Person not found" }, { status: 404 });

  const stats: any = {};
  await db.$transaction(async (tx) => {
    stats.activities = await tx.activityLog.updateMany({ where: { personId: sourceId }, data: { personId: targetId } }).then(r=>r.count);
    stats.goals = await tx.goalPlan.updateMany({ where: { personId: sourceId }, data: { personId: targetId } }).then(r=>r.count);
    stats.tags = await tx.personTag.updateMany({ where: { personId: sourceId }, data: { personId: targetId } }).then(r=>r.count);
    const tgtAsg = await tx.assignment.findFirst({ where: { personId: targetId } });
    if (!tgtAsg) {
      const srcAsg = await tx.assignment.findFirst({ where: { personId: sourceId } });
      if (srcAsg) {
        await tx.assignment.update({ where: { id: srcAsg.id }, data: { personId: targetId } });
        stats.assignmentMoved = true;
      }
    }
    // soft-delete source
    await tx.person.update({ where: { id: sourceId }, data: { deletedAt: new Date() } });
    await tx.mergeLog.create({ data: { sourceId, targetId, stats } });
  });

  await audit("person.merge", { entity: "person", entityId: targetId, meta: { sourceId, targetId, stats } });
  return NextResponse.json({ ok: true, stats });
}

export async function PATCH(req: NextRequest){
  // Undo merge (reactivate source). Note: does NOT move records back; it only unarchives the source.
  const body = await req.json();
  const { mergeId } = body ?? {};
  if (!mergeId) return NextResponse.json({ error: "mergeId required" }, { status: 400 });
  const log = await db.mergeLog.findUnique({ where: { id: mergeId } });
  if (!log) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.$transaction(async (tx) => {
    await tx.person.update({ where: { id: log.sourceId }, data: { deletedAt: null } });
    await tx.mergeLog.update({ where: { id: mergeId }, data: { undone: true } });
  });
  await audit("person.merge.undo", { entity: "person", entityId: log.sourceId, meta: { mergeId } });
  return NextResponse.json({ ok: true });
}
