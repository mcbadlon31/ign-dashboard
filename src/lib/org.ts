
import { cookies, headers } from "next/headers";
import { db } from "./db";

export async function resolveOrgId(): Promise<string|null> {
  const h = headers();
  const viaHeader = h.get("x-ign-org");
  if (viaHeader) {
    const bySlug = await db.org.findFirst({ where: { OR: [{ id: viaHeader }, { slug: viaHeader }] } });
    if (bySlug) return bySlug.id;
  }
  const c = cookies().get("ign_org")?.value;
  if (c) {
    const byCookie = await db.org.findFirst({ where: { OR: [{ id: c }, { slug: c }] } });
    if (byCookie) return byCookie.id;
  }
  const first = await db.org.findFirst({ orderBy: { createdAt: "asc" } });
  return first?.id || null;
}
