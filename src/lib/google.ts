import "server-only";
import crypto from "crypto";

const AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_STATE_COOKIE = "google_oauth_state";
export const GOOGLE_VERIFIER_COOKIE = "google_oauth_verifier";
export const GOOGLE_FLOW_MAX_AGE_SECONDS = 10 * 60;
export const GOOGLE_SCOPES = "openid email profile";

export type GoogleTokenResponse = {
  access_token?: string;
};

export type GoogleUser = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

function googleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env variables are not set",
    );
  }
  return { clientId, clientSecret };
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function googleRedirectUri() {
  return `${appUrl()}/api/auth/google/callback`;
}

export function googleLoginErrorUrl(errorCode: string) {
  return `${appUrl()}/auth/login?error=${errorCode}`;
}

export function randomState() {
  return crypto.randomBytes(24).toString("base64url");
}

export function createPkce() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export function buildGoogleAuthUrl(state: string, codeChallenge: string) {
  const { clientId } = googleCredentials();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    scope: GOOGLE_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${AUTHORIZATION_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
): Promise<string> {
  const { clientId, clientSecret } = googleCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: googleRedirectUri(),
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed with status ${res.status}`);
  }
  const data = (await res.json()) as GoogleTokenResponse;
  if (!data.access_token) {
    throw new Error("Google token response is missing access_token");
  }
  return data.access_token;
}

export async function fetchGoogleUser(
  accessToken: string,
): Promise<GoogleUser> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Google userinfo request failed with status ${res.status}`);
  }
  return (await res.json()) as GoogleUser;
}
