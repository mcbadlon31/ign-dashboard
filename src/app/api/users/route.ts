
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEmailFromReq, isAdminEmail } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const email = await getEmailFromReq(req);
  if (!isAdminEmail(email) && process.env.DEV_BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await db.user.findMany({ orderBy: { email: "asc" } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const email = await getEmailFromReq(req);
  if (!isAdminEmail(email) && process.env.DEV_BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { email: newEmail, displayName, appRole } = body ?? {};
  if (!newEmail) return NextResponse.json({ error: "email required" }, { status: 400 });
  const user = await db.user.upsert({
    where: { email: newEmail },
    update: { displayName: displayName ?? null, appRole: appRole ?? "VIEWER" },
    create: { email: newEmail, displayName: displayName ?? null, appRole: appRole ?? "VIEWER" },
  });
  return NextResponse.json(user, { status: 201 });
}
