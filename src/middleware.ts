import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/scan", "/api/qrcode"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/uploads") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const session = request.cookies.get("gmao_session");

  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
