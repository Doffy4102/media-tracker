import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/dashboard", "/media"];
const publicRoutes = ["/auth/login", "/auth/register"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = protectedRoutes.some((p) => path.startsWith(p));
  const isPublic = publicRoutes.some((p) => path.startsWith(p));
  const isHome = path === "/";

  const sessionCookie = req.cookies.get("session")?.value;
  const session = await decrypt(sessionCookie);

  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  if (isHome && !session?.userId) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  if ((isPublic || isHome) && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
