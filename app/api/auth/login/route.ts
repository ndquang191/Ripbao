import { NextResponse } from "next/server";
import { createSession, normalizeUsername, setSessionCookie, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const username = normalizeUsername(String(body?.username ?? ""));
  const password = String(body?.password ?? "");
  const sql = getDb();
  const rows = await sql`
    SELECT users.id, users.username, users.display_name AS "displayName",
      users.facebook_url AS "facebookUrl", user_authentication.password_hash AS "passwordHash"
    FROM users
    JOIN user_authentication ON user_authentication.user_id = users.id
    WHERE users.username = ${username}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || !await verifyPassword(password, String(row.passwordHash))) {
    return NextResponse.json({ error: "Username hoặc mật khẩu chưa đúng." }, { status: 401 });
  }
  const session = await createSession(Number(row.id));
  await setSessionCookie(session.token, session.expiresAt);
  return NextResponse.json({ user: { id: Number(row.id), username: row.username, displayName: row.displayName, facebookUrl: row.facebookUrl } });
}
