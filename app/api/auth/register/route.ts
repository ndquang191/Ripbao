import { NextResponse } from "next/server";
import { createSession, getCurrentUser, hashPassword, normalizeUsername, setSessionCookie, validUsername } from "@/lib/auth";
import { getDb } from "@/lib/db";

const defaultTradingOptions = [
  ["nexus-night", "Nexus Night", 0],
  ["skirmish", "Skirmish", 1],
  ["ship-inner-city", "Ship nội thành", 2],
  ["ship-nationwide", "Ship toàn quốc", 3],
] as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const username = normalizeUsername(String(body?.username ?? ""));
  const displayName = String(body?.displayName ?? "").trim();
  const password = String(body?.password ?? "");
  const facebookUrl = String(body?.facebookUrl ?? "").trim() || null;

  if (!validUsername(username)) return NextResponse.json({ error: "Username phải dài 3–32 ký tự và chỉ gồm chữ thường, số, dấu chấm hoặc gạch dưới." }, { status: 400 });
  if (!displayName) return NextResponse.json({ error: "Tên hiển thị không được để trống." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Mật khẩu phải có ít nhất 8 ký tự." }, { status: 400 });

  try {
    const sql = getDb();
    const passwordHash = await hashPassword(password);
    const currentUser = await getCurrentUser();
    if (currentUser?.isGuest) {
      await sql.transaction((tx) => [
        tx`UPDATE users SET username = ${username}, display_name = ${displayName}, facebook_url = ${facebookUrl}, is_guest = false, updated_at = now() WHERE id = ${currentUser.id}`,
        tx`INSERT INTO user_authentication (user_id, password_hash) VALUES (${currentUser.id}, ${passwordHash})`,
        ...defaultTradingOptions.map(([optionId, name, position]) => tx`
          INSERT INTO user_trading_preferences (user_id, option_id, name, enabled, position)
          VALUES (${currentUser.id}, ${optionId}, ${name}, false, ${position})
        `),
      ]);
      return NextResponse.json({ user: { id: currentUser.id, username, displayName, facebookUrl } }, { status: 201 });
    }
    const result = await sql.transaction((tx) => [
      tx`INSERT INTO users (username, display_name, facebook_url) VALUES (${username}, ${displayName}, ${facebookUrl}) RETURNING id`,
      tx`
        INSERT INTO user_authentication (user_id, password_hash)
        SELECT id, ${passwordHash} FROM users WHERE username = ${username}
      `,
      ...defaultTradingOptions.map(([optionId, name, position]) => tx`
        INSERT INTO user_trading_preferences (user_id, option_id, name, enabled, position)
        SELECT id, ${optionId}, ${name}, false, ${position} FROM users WHERE username = ${username}
      `),
    ]);
    const userId = Number(result[0][0].id);
    const session = await createSession(userId);
    await setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ user: { id: userId, username, displayName, facebookUrl } }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: "Username đã được sử dụng." }, { status: 409 });
    return NextResponse.json({ error: "Không thể tạo tài khoản." }, { status: 500 });
  }
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
