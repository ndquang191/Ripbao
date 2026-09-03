import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const displayName = String(body?.displayName ?? "").trim();
  const facebookUrl = String(body?.facebookUrl ?? "").trim() || null;
  const password = String(body?.password ?? "");
  if (!displayName) return NextResponse.json({ error: "Tên hiển thị không được để trống." }, { status: 400 });
  if (password && password.length < 8) return NextResponse.json({ error: "Mật khẩu phải có ít nhất 8 ký tự." }, { status: 400 });
  const sql = getDb();
  const passwordHash = password ? await hashPassword(password) : null;
  await sql.transaction((tx) => [
    tx`UPDATE users SET display_name = ${displayName}, facebook_url = ${facebookUrl}, updated_at = now() WHERE id = ${user.id}`,
    ...(passwordHash ? [tx`UPDATE user_authentication SET password_hash = ${passwordHash}, password_changed_at = now(), failed_attempts = 0, locked_until = NULL WHERE user_id = ${user.id}`] : []),
  ]);
  return NextResponse.json({ user: { ...user, displayName, facebookUrl } });
}
