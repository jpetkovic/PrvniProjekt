import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";

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

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  if (errorParam) {
    return NextResponse.redirect(`${base}/?verified=error`);
  }

  // Validate CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!state || state !== savedState) {
    return NextResponse.redirect(`${base}/?verified=invalid`);
  }

  if (!code) {
    return NextResponse.redirect(`${base}/?verified=error`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${base}/api/auth/google/callback`;

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
    return NextResponse.redirect(`${base}/?verified=error`);
  }

  // Fetch user info
  let googleUser: GoogleUserInfo;
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    googleUser = await res.json() as GoogleUserInfo;
  } catch {
    return NextResponse.redirect(`${base}/?verified=error`);
  }

  if (!googleUser.email) {
    return NextResponse.redirect(`${base}/?verified=error`);
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
  return NextResponse.redirect(`${base}/?google=success`);
}
