
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const people = await db.person.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: "asc" } });
  return NextResponse.json(people);
}
