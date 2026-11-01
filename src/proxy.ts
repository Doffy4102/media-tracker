import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_REFRESH_THRESHOLD_MS,
  decrypt,
  sessionCookieOptions,
  signSession,
} from "@/lib/session";

const protectedRoutes = ["/dashboard", "/profile"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = protectedRoutes.some((p) => path.startsWith(p));

  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decrypt(sessionCookie);

  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  const response = NextResponse.next();

  if (session?.userId && new Date(session.expiresAt).getTime() - Date.now() < SESSION_REFRESH_THRESHOLD_MS) {
    const { token, expiresAt } = await signSession(session.userId);
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
