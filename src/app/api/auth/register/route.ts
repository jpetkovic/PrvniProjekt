import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, createVerificationToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const name = body.name?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Neplatný e-mail" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Heslo musí mít alespoň 8 znaků" },
      { status: 400 }
    );
  }

  const isDev = process.env.NODE_ENV !== "production";

  // 1) Create the user as NOT verified — login is blocked until confirmation.
  let user: { id: string; email: string };
  try {
    user = await prisma.user.create({
      data: { email, name, passwordHash: hashPassword(password) },
      select: { id: true, email: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Uživatel s tímto e-mailem už existuje" },
        { status: 409 }
      );
    }
    console.error("Register failed:", error);
    return NextResponse.json(
      {
        error: "Registrace se nezdařila",
        detail: isDev && error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }

  // 2) Build the verification link. E-mail sending is intentionally not
  //    implemented — the link is logged to the server console (and returned
  //    in development) so the account can be confirmed.
  const token = createVerificationToken(user.id);
  const link = `${new URL(request.url).origin}/api/auth/verify?token=${token}`;
  console.info(`[verify] Verification link for ${user.email}: ${link}`);

  return NextResponse.json(
    {
      message:
        "Účet byl vytvořen. Otevři potvrzovací odkaz (najdeš ho v konzoli serveru) — po potvrzení se můžeš přihlásit.",
      verifyUrl: isDev ? link : undefined,
    },
    { status: 201 }
  );
}
