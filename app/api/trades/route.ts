import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createSession, getCurrentUser, setSessionCookie, type AuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const sql = getDb();
  const rows = await sql`
    SELECT requests.id, requests.status, requests.created_at AS "createdAt",
      requests.buyer_contact_phone AS "buyerContactPhone",
      requests.completed_at AS "completedAt", buyers.username AS buyer,
      buyers.facebook_url AS "buyerFacebookUrl", sellers.username AS seller,
      sellers.facebook_url AS "sellerFacebookUrl",
      CASE WHEN requests.seller_id = ${user.id} THEN 'seller' ELSE 'buyer' END AS role,
      CASE WHEN requests.seller_id = ${user.id} THEN buyers.username ELSE sellers.username END AS "counterpartyUsername",
      CASE WHEN requests.seller_id = ${user.id} THEN buyers.display_name ELSE sellers.display_name END AS "counterparty",
      CASE WHEN requests.seller_id = ${user.id} THEN buyers.facebook_url ELSE sellers.facebook_url END AS "counterpartyFacebookUrl",
      CASE WHEN requests.seller_id = ${user.id} THEN buyers.is_guest ELSE sellers.is_guest END AS "counterpartyIsGuest",
      COALESCE(json_agg(json_build_object(
        'id', items.id, 'listingId', listings.id, 'cardId', cards.id,
        'name', cards.name, 'set', cards.set_name, 'number', cards.collector_number,
        'imageUrl', cards.image_url, 'finish', listings.finish,
        'condition', listings.condition, 'quantity', items.quantity,
        'unitPrice', items.unit_price_vnd, 'stock', listings.quantity
      ) ORDER BY items.id) FILTER (WHERE items.id IS NOT NULL), '[]') AS items
    FROM trade_requests AS requests
    JOIN users AS buyers ON buyers.id = requests.buyer_id
    JOIN users AS sellers ON sellers.id = requests.seller_id
    LEFT JOIN trade_request_items AS items ON items.request_id = requests.id
    LEFT JOIN listings ON listings.id = items.listing_id
    LEFT JOIN cards ON cards.id = listings.card_id
    WHERE (requests.buyer_id = ${user.id} AND requests.buyer_hidden_at IS NULL)
      OR (requests.seller_id = ${user.id} AND requests.seller_hidden_at IS NULL)
    GROUP BY requests.id, buyers.id, sellers.id
    ORDER BY requests.created_at DESC
  `;
  return NextResponse.json({ requests: rows, username: user.username });
}

export async function POST(request: Request) {
  let user = await getCurrentUser();
  const sql = getDb();
  if (!user) {
    const guestId = randomBytes(4).toString("hex");
    const username = `guest_${guestId}`;
    const displayName = `Khách #${guestId.slice(0, 6).toUpperCase()}`;
    const rows = await sql`INSERT INTO users (username, display_name, is_guest) VALUES (${username}, ${displayName}, true) RETURNING id`;
    const session = await createSession(Number(rows[0].id));
    await setSessionCookie(session.token, session.expiresAt);
    user = { id: Number(rows[0].id), username, displayName, facebookUrl: null, isGuest: true } satisfies AuthUser;
  }
  const body = await request.json().catch(() => null) as { items?: Array<{ seller?: string; cardId?: string; finish?: string; condition?: string; quantity?: number }> } | null;
  const submitted = (body?.items ?? []).map((item) => ({ seller: String(item.seller ?? "").toLowerCase(), card_id: String(item.cardId ?? ""), finish: String(item.finish ?? "").toLowerCase() === "foil" ? "foil" : "nonfoil", condition: String(item.condition ?? "unspecified"), quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)) })).filter((item) => item.seller && item.card_id);
  const payload = JSON.stringify(submitted);
  const rows = await sql`
    WITH active_cart AS (
      SELECT id FROM carts WHERE user_id = ${user.id} AND status = 'active'
    ), submitted AS (
      SELECT listings.id AS listing_id, LEAST(value.quantity, listings.quantity) AS quantity,
        listings.min_price_vnd AS unit_price_vnd, listings.user_id AS seller_id
      FROM jsonb_to_recordset(${payload}::jsonb) AS value(seller text, card_id text, finish text, condition text, quantity integer)
      JOIN users AS seller ON seller.username = value.seller
      JOIN listings ON listings.user_id = seller.id AND listings.card_id = value.card_id
        AND listings.finish = value.finish AND listings.condition = value.condition
      WHERE listings.is_active AND listings.quantity > 0 AND listings.user_id <> ${user.id}
    ), source AS (
      SELECT cart_items.listing_id, LEAST(cart_items.quantity, listings.quantity) AS quantity,
        cart_items.unit_price_vnd, listings.user_id AS seller_id
      FROM active_cart
      JOIN cart_items ON cart_items.cart_id = active_cart.id
      JOIN listings ON listings.id = cart_items.listing_id
      WHERE listings.is_active AND listings.quantity > 0 AND listings.user_id <> ${user.id} AND ${submitted.length} = 0
      UNION ALL SELECT listing_id, quantity, unit_price_vnd, seller_id FROM submitted
    ), created AS (
      INSERT INTO trade_requests (buyer_id, seller_id)
      SELECT ${user.id}, seller_id FROM source GROUP BY seller_id
      RETURNING id, seller_id
    ), inserted AS (
      INSERT INTO trade_request_items (request_id, listing_id, quantity, unit_price_vnd)
      SELECT created.id, source.listing_id, source.quantity, source.unit_price_vnd
      FROM source JOIN created USING (seller_id)
      RETURNING request_id
    ), converted AS (
      UPDATE carts SET status = 'converted', updated_at = now()
      WHERE id IN (SELECT id FROM active_cart) AND EXISTS (SELECT 1 FROM inserted) AND ${submitted.length} = 0
    )
    SELECT id FROM created
  `;
  if (rows.length === 0) return NextResponse.json({ error: "Giỏ hàng không còn card khả dụng." }, { status: 409 });
  return NextResponse.json({ created: rows.length, ids: rows.map((row) => String(row.id)), user: { username: user.username, displayName: user.displayName, facebookUrl: user.facebookUrl, isGuest: user.isGuest } }, { status: 201 });
}
