import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const result = await sql.transaction((tx) => [
    tx`
      DELETE FROM auth_sessions
      WHERE expires_at < now() OR revoked_at < now() - interval '7 days'
      RETURNING token_hash
    `,
    tx`
      DELETE FROM request_rate_limits
      WHERE updated_at < now() - interval '2 days'
      RETURNING key
    `,
    tx`
      DELETE FROM carts
      WHERE status IN ('converted', 'abandoned')
        AND updated_at < now() - interval '90 days'
      RETURNING id
    `,
    tx`
      DELETE FROM users AS guest
      WHERE guest.is_guest
        AND guest.created_at < now() - interval '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM trade_requests
          WHERE buyer_id = guest.id OR seller_id = guest.id
        )
      RETURNING id
    `,
  ]);

  return NextResponse.json({
    deleted: {
      sessions: result[0].length,
      rateLimits: result[1].length,
      carts: result[2].length,
      unusedGuests: result[3].length,
    },
  });
}
