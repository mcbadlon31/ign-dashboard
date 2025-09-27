
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const rows = await db.alertLog.findMany({ where: { ...(type? { type } : {}) }, orderBy: { sentAt: "desc" }, take: 100 });
  return NextResponse.json(rows);
}
