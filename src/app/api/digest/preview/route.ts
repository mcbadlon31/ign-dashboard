import { NextRequest, NextResponse } from "next/server";
import { buildDigestPreviewHtml } from "@/lib/digest";
import { resolveOrgId } from "@/lib/org";
import { canAccessOutreachId, getEmailFromReq, isAdminEmail } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const bypass = process.env.DEV_BYPASS_AUTH === "true";
  const email = await getEmailFromReq(req);
  if (!bypass && !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const outreachId = searchParams.get("outreachId") || undefined;

  const orgId = await resolveOrgId({ email });
  if (!orgId) return NextResponse.json({ error: "No organization access" }, { status: 403 });

  if (outreachId && !(bypass || (email && isAdminEmail(email)))) {
    const allowed = await canAccessOutreachId(email, outreachId);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const html = await buildDigestPreviewHtml({ orgId, outreachId });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
