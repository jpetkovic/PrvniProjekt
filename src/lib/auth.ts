import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";

// --- Password hashing (scrypt, no external dependencies) ---

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}

// --- Session token (HMAC-signed, stateless) ---

const SECRET =
  process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = b64url(JSON.stringify({ uid: userId, exp }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const { uid, exp } = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as { uid: string; exp: number };
    if (typeof exp !== "number" || Date.now() > exp) return null;
    return uid;
  } catch {
    return null;
  }
}
