import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVerificationToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const token = new URL(request.url).searchParams.get("token") ?? undefined;

  const userId = verifyVerificationToken(token);
  if (!userId) {
    return NextResponse.redirect(`${origin}/?verified=invalid`);
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.redirect(`${origin}/?verified=invalid`);
    }
    // Idempotent: re-clicking an already-used link is fine.
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
      });
    }
    return NextResponse.redirect(`${origin}/?verified=success`);
  } catch (error) {
    console.error("Verify failed:", error);
    return NextResponse.redirect(`${origin}/?verified=error`);
  }
}
