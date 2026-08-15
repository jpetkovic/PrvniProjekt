import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/auth";

export const runtime = "nodejs";

interface GoogleTokenInfo {
  aud: string;
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  exp?: string;
  error_description?: string;
}

/** Client IDs whose ID tokens we accept (web + Android). */
function allowedAudiences(): string[] {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    ...(process.env.GOOGLE_ALLOWED_AUDIENCES?.split(",") ?? []),
  ]
    .map((v) => v?.trim())
    .filter((v): v is string => !!v);
}

/**
 * Native (Android/iOS) sign-in: the app obtains a Google ID token via the
 * native Sign-in flow and POSTs `{ idToken }` here. We verify the token with
 * Google, upsert the user, and return a session token the app stores and sends
 * back as `Authorization: Bearer <token>`.
 */
export async function POST(request: Request) {
  let body: { idToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek" }, { status: 400 });
  }

  const idToken = body.idToken?.trim();
  if (!idToken) {
    return NextResponse.json({ error: "Chybí idToken" }, { status: 400 });
  }

  // Verify the ID token with Google (validates signature + expiry server-side).
  let info: GoogleTokenInfo;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    info = (await res.json()) as GoogleTokenInfo;
    if (!res.ok || info.error_description) {
      throw new Error(info.error_description ?? `HTTP ${res.status}`);
    }
  } catch {
    return NextResponse.json({ error: "Neplatný Google token" }, { status: 401 });
  }

  // The token must have been issued for one of our own client IDs.
  if (!allowedAudiences().includes(info.aud)) {
    return NextResponse.json(
      { error: "Token nepatří této aplikaci" },
      { status: 401 }
    );
  }

  const emailVerified =
    info.email_verified === true || info.email_verified === "true";
  if (!info.email || !emailVerified) {
    return NextResponse.json(
      { error: "Google účet nemá ověřený e-mail" },
      { status: 401 }
    );
  }

  const email = info.email.toLowerCase();
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      googleId: info.sub,
      emailVerified: { set: new Date() },
      ...(info.name ? { name: info.name } : {}),
    },
    create: {
      email,
      name: info.name ?? null,
      googleId: info.sub,
      emailVerified: new Date(),
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({
    user,
    token: createSessionToken(user.id),
  });
}
