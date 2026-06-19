import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { setSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Zadej e-mail i heslo" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Same response for unknown user and wrong password (no user enumeration).
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: "Nesprávný e-mail nebo heslo" },
      { status: 401 }
    );
  }

  // Block login until the e-mail address has been confirmed.
  if (!user.emailVerified) {
    return NextResponse.json(
      {
        error:
          "E-mail zatím není potvrzený. Zkontroluj si schránku a klikni na potvrzovací odkaz.",
      },
      { status: 403 }
    );
  }

  await setSession(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
