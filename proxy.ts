import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  const isAuthPage = pathname.startsWith("/login");
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/customers");

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/dashboard") {
      loginUrl.searchParams.set("callbackUrl", encodeURI(pathname));
    }
    return NextResponse.redirect(loginUrl);
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
