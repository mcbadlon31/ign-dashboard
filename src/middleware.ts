
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (process.env.DEV_BYPASS_AUTH === "true") return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  // Basic gate: require a session cookie (handled by next-auth)
  const hasSession = req.cookies.get("next-auth.session-token") || req.cookies.get("__Secure-next-auth.session-token");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/signin";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
