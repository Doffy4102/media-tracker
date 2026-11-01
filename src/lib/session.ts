import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_REFRESH_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) throw new Error("AUTH_SECRET env variable is not set");
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  [key: string]: unknown;
  userId: string;
  expiresAt: Date;
}

function sessionExpiry() {
  return new Date(Date.now() + SESSION_MAX_AGE_MS);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    if (typeof payload.expiresAt === "string") {
      payload.expiresAt = new Date(payload.expiresAt);
    }
    return payload as unknown as SessionPayload;
  } catch {
    return undefined;
  }
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax" as const,
    path: "/",
  };
}

/** Signs a fresh session without writing the cookie. Use where the cookie is set on a manual Response (proxy, OAuth callback). */
export async function signSession(userId: string) {
  const expiresAt = sessionExpiry();
  const token = await encrypt({ userId, expiresAt });
  return { token, expiresAt };
}

export async function createSession(userId: string) {
  const { token, expiresAt } = await signSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt));
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
