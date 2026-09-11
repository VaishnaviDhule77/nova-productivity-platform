import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me");

async function isValid(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const authed = await isValid(req.cookies.get("nova_session")?.value);
  const { pathname } = req.nextUrl;

  if (!authed && (pathname.startsWith("/dashboard") || pathname.startsWith("/projects"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
    if (authed && pathname === "/signup") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/login", "/signup"],
};