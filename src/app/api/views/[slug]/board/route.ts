import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveOrgId } from "@/lib/org";
import { canAccessOutreachId, getEmailFromReq, isAdminEmail } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: { slug: string }}) {
  const bypass = process.env.DEV_BYPASS_AUTH === "true";
  const email = await getEmailFromReq(req);
  if (!bypass && !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "No organization access" }, { status: 403 });

  const view = await db.savedView.findUnique({
    where: { slug: params.slug },
    include: { outreach: { select: { id: true, orgId: true, name: true } } },
  });
  if (!view) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (view.outreach && view.outreach.orgId !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isAdmin = email ? isAdminEmail(email) : false;
  let allowed = bypass || isAdmin;
  if (!allowed) {
    if (view.createdBy && email && view.createdBy === email) {
      allowed = true;
    } else if (view.isPublic) {
      allowed = true;
    } else if (view.outreachId) {
      allowed = await canAccessOutreachId(email, view.outreachId);
    }
  }

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filters = (view.filters ?? {}) as Record<string, unknown>;
  const tagIds = Array.isArray(filters.tagIds) ? (filters.tagIds as string[]) : [];
  const outreachId = view.outreachId ?? undefined;

  const people = await db.person.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(outreachId ? { outreachId } : {}),
      ...(tagIds.length
        ? {
            tags: {
              some: { tagId: { in: tagIds } },
            },
          }
        : {}),
    },
    include: {
      outreach: true,
      assignment: { include: { role: true } },
      goalPlans: {
        where: { status: { in: ["PLANNED", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { target: true, milestones: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const mapped = people.map(person => {
    const goal = person.goalPlans[0];
    const total = goal?.milestones.length || 0;
    const done = goal ? goal.milestones.filter(milestone => milestone.completed).length : 0;
    const ready = total > 0 ? done / total >= 0.75 : false;
    return {
      id: person.id,
      name: `${person.fullName}${person.outreach ? " • " + person.outreach.name : ""}`,
      currentRole: person.assignment?.role?.name ?? null,
      goal: goal ? { name: goal.target?.name ?? "", progress: `${done}/${total}` } : null,
      ready,
    };
  });

  return NextResponse.json({ people: mapped, outreachId });
}
