import { cookies, headers } from "next/headers";
import { db } from "./db";
import { isAdminEmail } from "./rbac";

export type ResolveOrgOptions = {
  email?: string | null;
  hint?: string | null;
};

async function findOrgByIdOrSlug(candidate: string) {
  return db.org.findFirst({ where: { OR: [{ id: candidate }, { slug: candidate }] } });
}

function candidateEmails(email: string) {
  const normalized = email.toLowerCase();
  return Array.from(new Set([email, normalized].filter(Boolean))) as string[];
}

async function userHasOrgAccess(orgId: string, email: string | null, bypass: boolean) {
  if (bypass) return true;
  if (!email) return false;
  if (isAdminEmail(email)) return true;

  const emails = candidateEmails(email);
  const direct = await db.userOrg.findFirst({
    where: { orgId, userEmail: { in: emails } },
    select: { id: true },
  });
  if (direct) return true;

  const viaOutreach = await db.outreachAccess.findFirst({
    where: { userEmail: { in: emails }, outreach: { orgId } },
    select: { id: true },
  });
  return !!viaOutreach;
}

export async function listAccessibleOrgIds(email: string | null): Promise<string[]> {
  if (!email) return [];
  const emails = candidateEmails(email);
  const results = new Set<string>();

  const orgLinks = await db.userOrg.findMany({ where: { userEmail: { in: emails } }, select: { orgId: true } });
  for (const link of orgLinks) {
    if (link.orgId) results.add(link.orgId);
  }

  const outreachLinks = await db.outreachAccess.findMany({
    where: { userEmail: { in: emails } },
    select: { outreach: { select: { orgId: true } } },
  });
  for (const link of outreachLinks) {
    const orgId = link.outreach?.orgId;
    if (orgId) results.add(orgId);
  }

  return Array.from(results);
}

export async function resolveOrgId(options: ResolveOrgOptions = {}): Promise<string | null> {
  const email = options.email ?? null;
  const bypass = process.env.DEV_BYPASS_AUTH === "true";

  const explicitHint = options.hint?.trim();
  const headerHint = headers().get("x-ign-org")?.trim() ?? null;
  const cookieHint = cookies().get("ign_org")?.value?.trim() ?? null;

  const candidates = [explicitHint, headerHint, cookieHint].filter((value): value is string => !!value);
  for (const candidate of candidates) {
    const org = await findOrgByIdOrSlug(candidate);
    if (!org) continue;
    const allowed = await userHasOrgAccess(org.id, email, bypass);
    if (allowed) return org.id;
  }

  if (email) {
    const accessible = await listAccessibleOrgIds(email);
    if (accessible.length > 0) return accessible[0];
  }

  if (bypass || (email && isAdminEmail(email))) {
    const first = await db.org.findFirst({ orderBy: { createdAt: "asc" } });
    return first?.id ?? null;
  }

  return null;
}
