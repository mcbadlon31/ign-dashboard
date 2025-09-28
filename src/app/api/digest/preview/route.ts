import { NextRequest, NextResponse } from "next/server";
import { buildDigestPreviewHtml } from "@/lib/digest";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const outreachId = searchParams.get("outreachId") || undefined;
  const html = await buildDigestPreviewHtml(outreachId ?? undefined);
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
