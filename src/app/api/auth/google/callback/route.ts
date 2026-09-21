import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSession, getCurrentUser } from "@/lib/session";
import { getBaseUrl, googleRedirectUri } from "@/lib/oauth";

export const runtime = "nodejs";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  email_verified?: boolean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // HTTPS base outside localhost — matches the redirect URI used at start.
  const base = getBaseUrl(request);

  // A browser prefetch / link scanner can hit this callback twice. The first
  // request consumes the one-time `oauth_state` cookie and the one-time
  // authorization `code` (which Google then refuses to reuse), so the second
  // request fails at state validation OR at the token exchange — even though
  // the user is already signed in. Whenever we bail out, if a valid session
  // already exists, report success instead of a misleading error.
  const fail = async () =>
    NextResponse.redirect(
      `${base}/?login=${(await getCurrentUser()) ? "success" : "error"}`
    );

  if (errorParam) {
    return fail();
  }

  // Validate CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!state || state !== savedState) {
    return fail();
  }

  if (!code) {
    return fail();
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = googleRedirectUri(request);

  // Exchange code for tokens
  let tokens: GoogleTokenResponse;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    tokens = await res.json() as GoogleTokenResponse;
    if (tokens.error) throw new Error(tokens.error);
  } catch {
    return fail();
  }

  // Fetch user info
  let googleUser: GoogleUserInfo;
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    googleUser = await res.json() as GoogleUserInfo;
  } catch {
    return fail();
  }

  if (!googleUser.email) {
    return fail();
  }

  // Upsert user: connect Google account or create new one
  const user = await prisma.user.upsert({
    where: { email: googleUser.email },
    update: {
      googleId: googleUser.sub,
      // Set emailVerified if not already set
      emailVerified: { set: new Date() },
      ...(googleUser.name ? { name: googleUser.name } : {}),
    },
    create: {
      email: googleUser.email,
      name: googleUser.name ?? null,
      googleId: googleUser.sub,
      emailVerified: new Date(),
    },
  });

  await setSession(user.id);
  return NextResponse.redirect(`${base}/?login=success`);
}
