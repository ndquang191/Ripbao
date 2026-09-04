import "server-only";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

const scrypt = promisify(scryptCallback);
export const sessionCookieName = "ripbao_session";
const sessionDurationMs = 30 * 24 * 60 * 60 * 1000;

export type AuthUser = {
  id: number;
  username: string;
  displayName: string;
  facebookUrl: string | null;
  isGuest: boolean;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltValue, hashValue] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, "base64url");
  const actual = (await scrypt(
    password,
    Buffer.from(saltValue, "base64url"),
    expected.length,
  )) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  const sql = getDb();
  await sql`
    INSERT INTO auth_sessions (token_hash, user_id, expires_at)
    VALUES (${hashSessionToken(token)}, ${userId}, ${expiresAt.toISOString()})
  `;
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token) {
    const sql = getDb();
    await sql`DELETE FROM auth_sessions WHERE token_hash = ${hashSessionToken(token)}`;
  }
  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;
  const sql = getDb();
  const rows = await sql`
    SELECT
      users.id,
      users.username,
      users.display_name AS "displayName",
      users.facebook_url AS "facebookUrl", users.is_guest AS "isGuest"
    FROM auth_sessions
    JOIN users ON users.id = auth_sessions.user_id
    WHERE auth_sessions.token_hash = ${hashSessionToken(token)}
      AND auth_sessions.revoked_at IS NULL
      AND auth_sessions.expires_at > now()
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return {
    id: Number(rows[0].id),
    username: String(rows[0].username),
    displayName: String(rows[0].displayName),
    facebookUrl:
      rows[0].facebookUrl == null ? null : String(rows[0].facebookUrl),
    isGuest: Boolean(rows[0].isGuest),
  };
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validUsername(value: string) {
  return /^[a-z0-9._]{3,32}$/.test(value);
}
