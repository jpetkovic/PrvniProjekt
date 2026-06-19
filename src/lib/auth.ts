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
  return createSignedToken(userId, "session", SESSION_MAX_AGE);
}

export function verifySessionToken(token: string | undefined): string | null {
  return verifySignedToken(token, "session");
}

// --- Email verification token (HMAC-signed, stateless) ---

export const VERIFICATION_MAX_AGE = 60 * 60 * 24; // 24 hours

export function createVerificationToken(userId: string): string {
  return createSignedToken(userId, "verify", VERIFICATION_MAX_AGE);
}

export function verifyVerificationToken(token: string | undefined): string | null {
  return verifySignedToken(token, "verify");
}

// --- Shared signed-token helpers ---

function createSignedToken(
  uid: string,
  purpose: string,
  maxAgeSec: number
): string {
  const exp = Date.now() + maxAgeSec * 1000;
  const payload = b64url(JSON.stringify({ uid, exp, purpose }));
  return `${payload}.${sign(payload)}`;
}

function verifySignedToken(
  token: string | undefined,
  purpose: string
): string | null {
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
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as { uid: string; exp: number; purpose?: string };
    if (typeof parsed.exp !== "number" || Date.now() > parsed.exp) return null;
    // Reject tokens minted for a different purpose.
    if ((parsed.purpose ?? "session") !== purpose) return null;
    return parsed.uid;
  } catch {
    return null;
  }
}
