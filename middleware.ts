import { authEdge as auth } from "@/auth.edge";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes
  const isPublicRoute = pathname === "/" || pathname === "/login" || pathname === "/register";

  // Auth routes
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  // Protected routes (dashboard and all sub-routes)
  const isProtectedRoute = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/accounts") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/vendors") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/reports-center") ||
    pathname.startsWith("/journal") ||
    pathname.startsWith("/reconciliation") ||
    pathname.startsWith("/settings");

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect non-logged-in users to login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
