
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest){
  const body = await req.json();
  const { roleId, milestones, createdBy, version } = body ?? {};
  if (!roleId || !Array.isArray(milestones)) return NextResponse.json({ error: "roleId and milestones[] required" }, { status: 400 });

  // Determine version if not provided: max(version)+1
  let ver = version;
  if (typeof ver !== "number") {
    const last = await db.roleTemplateVersion.findFirst({ where: { roleId }, orderBy: { version: "desc" } });
    ver = (last?.version || 0) + 1;
  }
  const rec = await db.roleTemplateVersion.create({
    data: { roleId, version: ver, milestonesJson: milestones, createdBy: createdBy || null }
  });
  await audit("templates.version.create", { meta: { roleId, version: ver, count: milestones.length } });
  return NextResponse.json(rec, { status: 201 });
}
