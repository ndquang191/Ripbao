import { NextResponse } from "next/server";
import { getCurrentUser, normalizeUsername } from "@/lib/auth";
import { getDb } from "@/lib/db";

type TradingPreference = {
  id?: string;
  optionId?: string | null;
  name?: string;
  detail?: string;
  enabled?: boolean;
  position?: number;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const username = normalizeUsername(
    decodeURIComponent((await params).username),
  );
  const sql = getDb();
  const items = await sql`
    SELECT preferences.id::text, preferences.option_id AS "optionId", preferences.name,
      preferences.detail, preferences.enabled, preferences.position
    FROM user_trading_preferences AS preferences
    JOIN users ON users.id = preferences.user_id
    WHERE users.username = ${username}
    ORDER BY preferences.position, preferences.id
  `;
  return NextResponse.json({ items });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const user = await getCurrentUser();
  const username = normalizeUsername(
    decodeURIComponent((await params).username),
  );
  if (!user || user.username !== username)
    return NextResponse.json(
      { error: "Bạn không có quyền cập nhật." },
      { status: 403 },
    );
  const body = (await request.json().catch(() => null)) as {
    items?: TradingPreference[];
  } | null;
  const items = (body?.items ?? [])
    .slice(0, 30)
    .map((item, index) => ({
      optionId: item.optionId || null,
      name: String(item.name ?? "").trim(),
      detail: String(item.detail ?? "").trim() || null,
      enabled: item.enabled === true,
      position:
        Number.isInteger(item.position) && Number(item.position) >= 0
          ? Number(item.position)
          : index,
    }))
    .filter((item) => item.name);
  const sql = getDb();
  const payload = JSON.stringify(
    items.map((item) => ({
      option_id: item.optionId,
      name: item.name,
      detail: item.detail,
      enabled: item.enabled,
      position: item.position,
    })),
  );
  await sql.transaction((tx) => [
    tx`DELETE FROM user_trading_preferences WHERE user_id = ${user.id}`,
    tx`
      INSERT INTO user_trading_preferences (user_id, option_id, name, detail, enabled, position)
      SELECT ${user.id}, item.option_id, item.name, item.detail, item.enabled, item.position
      FROM jsonb_to_recordset(${payload}::jsonb) AS item(option_id text, name text, detail text, enabled boolean, position integer)
    `,
  ]);
  return NextResponse.json({ items });
}
