import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

export async function getEmailFromReq(req: NextRequest): Promise<string | null> {
  if (process.env.DEV_BYPASS_AUTH === "true") return process.env.DEV_FAKE_EMAIL || "dev@example.com";
  const token = await getToken({ req });
  const email = (token as any)?.email as string | undefined;
  return email ?? null;
}

export function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || "";
  const list = raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function assertAdmin(req: NextRequest): Promise<{ ok: boolean; email: string | null; bypass: boolean }> {
  const email = await getEmailFromReq(req);
  const bypass = process.env.DEV_BYPASS_AUTH === "true";
  const ok = bypass || isAdminEmail(email);
  return { ok, email, bypass };
}

export async function canAccessOutreachId(email: string | null, outreachId: string | null): Promise<boolean> {
  if (!outreachId) return false;
  if (process.env.DEV_BYPASS_AUTH === "true") return true;
  if (isAdminEmail(email)) return true;
  if (!email) return false;
  const row = await db.outreachAccess.findUnique({ where: { userEmail_outreachId: { userEmail: email, outreachId } } });
  return !!row;
}

export async function canAccessPersonId(email: string | null, personId: string | null): Promise<boolean> {
  if (!personId) return false;
  if (process.env.DEV_BYPASS_AUTH === "true") return true;
  if (isAdminEmail(email)) return true;
  if (!email) return false;
  const p = await db.person.findUnique({ where: { id: personId }, select: { outreachId: true } });
  if (!p?.outreachId) return false;
  return canAccessOutreachId(email, p.outreachId);
}
