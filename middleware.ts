import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth";

const unprotectedRoutes = ["/login", "/api/auth/login", "/api/auth/logout"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isUnprotected = unprotectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isUnprotected || pathname.startsWith("/_next") || pathname === "/") {
    if (pathname === "/" && !(await isAuthenticated(req))) {
      return redirectToLogin(req);
    }
    if (isUnprotected) {
      return NextResponse.next();
    }
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname === "/"
  ) {
    const authenticated = await isAuthenticated(req);
    if (!authenticated) {
      return redirectToLogin(req);
    }
  }

  return NextResponse.next();
}

async function isAuthenticated(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return false;

  const payload = await verifyAuthToken(token);
  return Boolean(payload);
}

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("auth_token");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

