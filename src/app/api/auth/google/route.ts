import { NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  GOOGLE_FLOW_MAX_AGE_SECONDS,
  buildGoogleAuthUrl,
  createPkce,
  googleLoginErrorUrl,
  randomState,
} from "@/lib/google";

export async function GET() {
  try {
    const state = randomState();
    const { verifier, challenge } = createPkce();

    const response = NextResponse.redirect(buildGoogleAuthUrl(state, challenge));
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      maxAge: GOOGLE_FLOW_MAX_AGE_SECONDS,
      path: "/",
    };
    response.cookies.set(GOOGLE_STATE_COOKIE, state, cookieOptions);
    response.cookies.set(GOOGLE_VERIFIER_COOKIE, verifier, cookieOptions);
    return response;
  } catch {
    return NextResponse.redirect(googleLoginErrorUrl("google_unconfigured"));
  }
}

export const dynamic = "force-dynamic";
