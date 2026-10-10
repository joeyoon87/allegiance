import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

/**
 * Edge-safe session check only (built from the Prisma-free authConfig).
 * This is a fast redirect convenience, NOT the source of truth for
 * authorization — every page/action still calls
 * requireFacilitySession()/requireFacilityAccess() server-side (see
 * src/lib/portal/permissions.ts). Per the brief: never rely on
 * client-side navigation guards for security, and this isn't one either,
 * but it also isn't sufficient on its own.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth?.user);
  const isLoginPage = req.nextUrl.pathname === "/portal/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/portal/login", req.nextUrl.origin));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/portal/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/portal/:path*"],
};
