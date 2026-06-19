import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { setSession } from "@/lib/session";

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

  try {
    const user = await prisma.user.create({
      data: { email, name, passwordHash: hashPassword(password) },
      select: { id: true, email: true, name: true, role: true },
    });
    await setSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
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
        detail:
          process.env.NODE_ENV !== "production" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
