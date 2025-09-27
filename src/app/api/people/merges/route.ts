
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(){
  const rows = await db.mergeLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json(rows);
}
