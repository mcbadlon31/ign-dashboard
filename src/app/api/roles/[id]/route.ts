import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/rbac";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { name, tier, colorHex, isActive } = body ?? {};
  try {
    const updated = await db.role.update({
      where: { id: params.id },
      data: { name, tier, colorHex, isActive },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { ok } = await assertAdmin(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await db.role.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
