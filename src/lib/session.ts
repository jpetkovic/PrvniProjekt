import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth";

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  // Web clients send the session in an httpOnly cookie; native/mobile clients
  // (which have no cookie jar) send it as `Authorization: Bearer <token>`.
  const cookieStore = await cookies();
  let token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    const auth = (await headers()).get("authorization");
    if (auth?.startsWith("Bearer ")) token = auth.slice(7).trim();
  }

  const userId = verifySessionToken(token);
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

/** Returns the current user only if they have the ADMIN role, otherwise null. */
export async function getCurrentAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}
