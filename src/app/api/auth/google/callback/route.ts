import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  appUrl,
  exchangeGoogleCode,
  fetchGoogleUser,
  googleLoginErrorUrl,
} from "@/lib/google";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  signSession,
} from "@/lib/session";
import { sendLoginMethodLinkedEmail } from "@/lib/email";

function googleCallbackResponse(target: string) {
  const response = NextResponse.redirect(target);
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  response.cookies.delete(GOOGLE_VERIFIER_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;

  if (url.searchParams.get("error")) {
    return googleCallbackResponse(googleLoginErrorUrl("google_denied"));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateCookie = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(GOOGLE_VERIFIER_COOKIE)?.value;

  if (!code || !state || !stateCookie || state !== stateCookie || !verifier) {
    return googleCallbackResponse(googleLoginErrorUrl("google_invalid_state"));
  }

  try {
    const accessToken = await exchangeGoogleCode(code, verifier);
    const googleUser = await fetchGoogleUser(accessToken);

    if (
      !googleUser.sub ||
      !googleUser.email ||
      googleUser.email_verified !== true
    ) {
      return googleCallbackResponse(
        googleLoginErrorUrl("google_email_unverified"),
      );
    }

    let user = await prisma.user.findFirst({
      where: { email: { equals: googleUser.email, mode: "insensitive" } },
    });

    const linkedAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleUser.sub,
        },
      },
      include: { user: true },
    });

    if (linkedAccount) {
      user = linkedAccount.user;
    } else if (user) {
      try {
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: "google",
            providerAccountId: googleUser.sub,
          },
        });
        await sendLoginMethodLinkedEmail(user.email, googleUser.email);
      } catch {
        // The identity is already linked or the notification mail failed.
      }
    } else {
      user = await prisma.user.create({
        data: {
          name: googleUser.name ?? null,
          email: googleUser.email,
          password: null,
          oauthAccounts: {
            create: {
              provider: "google",
              providerAccountId: googleUser.sub,
            },
          },
        },
      });
    }

    const { token, expiresAt } = await signSession(user.id);
    const response = NextResponse.redirect(`${appUrl()}/dashboard`);
    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      sessionCookieOptions(expiresAt),
    );
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    response.cookies.delete(GOOGLE_VERIFIER_COOKIE);
    return response;
  } catch {
    return googleCallbackResponse(googleLoginErrorUrl("google_failed"));
  }
}

export const dynamic = "force-dynamic";
