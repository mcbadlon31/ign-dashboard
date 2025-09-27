
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEmailFromReq, isAdminEmail } from "@/lib/rbac";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const email = await getEmailFromReq(req);
  if (!isAdminEmail(email) && process.env.DEV_BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { displayName, appRole } = body ?? {};
  const u = await db.user.update({ where: { id: params.id }, data: { displayName, appRole } });
  return NextResponse.json(u);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const email = await getEmailFromReq(req);
  if (!isAdminEmail(email) && process.env.DEV_BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
