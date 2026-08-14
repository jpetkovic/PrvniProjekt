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

  if (errorParam) {
    return NextResponse.redirect(`${base}/?login=error`);
  }

  // Validate CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!state || state !== savedState) {
    // The state cookie is one-time: browser prefetch / link scanners can hit
    // this callback twice, and the first request already consumed the cookie
    // and signed the user in. If a valid session already exists, treat this
    // duplicate request as a success instead of a misleading CSRF error.
    if (await getCurrentUser()) {
      return NextResponse.redirect(`${base}/?login=success`);
    }
    return NextResponse.redirect(`${base}/?login=error`);
  }

  if (!code) {
    return NextResponse.redirect(`${base}/?login=error`);
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
    return NextResponse.redirect(`${base}/?login=error`);
  }

  // Fetch user info
  let googleUser: GoogleUserInfo;
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    googleUser = await res.json() as GoogleUserInfo;
  } catch {
    return NextResponse.redirect(`${base}/?login=error`);
  }

  if (!googleUser.email) {
    return NextResponse.redirect(`${base}/?login=error`);
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
