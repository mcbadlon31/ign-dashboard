
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 1000);
  const rows = await db.auditLog.findMany({ orderBy: { at: "desc" }, take: limit });
  return NextResponse.json(rows);
}
