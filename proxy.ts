import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  const isAuthPage = pathname.startsWith("/login");
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/quotations") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/employees") ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/audit-logs");

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/dashboard") {
      loginUrl.searchParams.set("callbackUrl", encodeURI(pathname));
    }
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only route guard
  const isAdminRoute =
    pathname.startsWith("/employees") || pathname.startsWith("/audit-logs");
  if (isAdminRoute && isLoggedIn) {
    const userRole = (req.auth?.user as { role?: string })?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/dashboard" : "/login", req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
