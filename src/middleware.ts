import { NextRequest, NextResponse } from "next/server";
import { verifyToken, SESSION_COOKIE, dashboardPath } from "@/lib/auth";

const ROLE_PREFIX: Record<string, string> = {
  "/student": "STUDENT",
  "/teacher": "TEACHER",
  "/admin": "ADMIN",
  "/supervisor": "SUPERVISOR",
};

const PUBLIC_PATHS = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifyToken(token);

  // משתמש מחובר שמנסה לגשת לדף ציבורי -> הפניה לדשבורד
  if (session && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL(dashboardPath(session.role), req.url));
  }

  // נתיב מוגן לפי prefix
  const matched = Object.keys(ROLE_PREFIX).find((p) => pathname.startsWith(p));
  if (matched) {
    if (!session) {
      const url = new URL("/login", req.url);
      return NextResponse.redirect(url);
    }
    if (session.role !== ROLE_PREFIX[matched]) {
      return NextResponse.redirect(new URL(dashboardPath(session.role), req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/student/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/supervisor/:path*",
  ],
};
