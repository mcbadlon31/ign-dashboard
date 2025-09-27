
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEmailFromReq, isAdminEmail } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const email = await getEmailFromReq(req);
  if (!isAdminEmail(email) && process.env.DEV_BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await db.outreachAccess.findMany({
    include: { outreach: { select: { id: true, name: true } } },
    orderBy: { userEmail: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromReq(req);
  if (!isAdminEmail(email) && process.env.DEV_BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { userEmail, outreachId, role } = body ?? {};
  if (!userEmail || !outreachId) return NextResponse.json({ error: "userEmail and outreachId required" }, { status: 400 });
  const row = await db.outreachAccess.upsert({
    where: { userEmail_outreachId: { userEmail, outreachId } },
    update: { role: role ?? "LEADER" },
    create: { userEmail, outreachId, role: role ?? "LEADER" },
  });
  return NextResponse.json(row, { status: 201 });
}
