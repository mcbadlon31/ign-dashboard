
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEmailFromReq, isAdminEmail } from "@/lib/rbac";

export async function DELETE(req: NextRequest, { params }: { params: { id: string }}){
  const email = await getEmailFromReq(req);
  if (!isAdminEmail(email) && process.env.DEV_BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.outreachAccess.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
