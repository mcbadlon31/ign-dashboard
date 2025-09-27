
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Mil = { title: string };

function toList(x:any): Mil[]{
  const arr = Array.isArray(x) ? x : [];
  return arr.map((m:any)=>({ title: String(m.title ?? m) }));
}

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const a = searchParams.get("a");
  const b = searchParams.get("b");
  if (!a || !b) return NextResponse.json({ error: "a and b required" }, { status: 400 });
  const [va, vb] = await Promise.all([
    db.roleTemplateVersion.findUnique({ where: { id: a } }),
    db.roleTemplateVersion.findUnique({ where: { id: b } }),
  ]);
  if (!va || !vb) return NextResponse.json({ error: "version not found" }, { status: 404 });
  const A = toList(va.milestonesJson); const B = toList(vb.milestonesJson);
  const add = B.filter(m => !A.find(x=>x.title.toLowerCase()===m.title.toLowerCase()));
  const rem = A.filter(m => !B.find(x=>x.title.toLowerCase()===m.title.toLowerCase()));
  const same = B.filter(m => A.find(x=>x.title.toLowerCase()===m.title.toLowerCase()));
  return NextResponse.json({ add, rem, same });
}
