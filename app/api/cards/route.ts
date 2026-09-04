import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const DEFAULT_SIZE = 25;
const MAX_SIZE = 100;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = normalizeQuery(params.get("q") ?? "");
  const page = positiveInteger(params.get("page"), 1);
  const size = Math.min(
    positiveInteger(params.get("size"), DEFAULT_SIZE),
    MAX_SIZE,
  );
  const offset = (page - 1) * size;
  const set = params.get("set")?.trim() || null;
  const type = params.get("type")?.trim() || null;
  const rarity = params.get("rarity")?.trim() || null;
  const domain = params.get("domain")?.trim() || null;

  try {
    const sql = getDb();
    const [items, count] = await Promise.all([
      sql`
        SELECT
          id,
          riftbound_id AS "riftboundId",
          tcgplayer_id AS "tcgplayerId",
          name,
          collector_number AS "collectorNumber",
          set_id AS "setId",
          set_name AS "set",
          type,
          supertype,
          rarity,
          domains,
          image_url AS "imageUrl"
        FROM cards
        WHERE is_active
          AND (${set}::text IS NULL OR set_id = ${set} OR set_name = ${set})
          AND (${type}::text IS NULL OR type = ${type})
          AND (${rarity}::text IS NULL OR rarity = ${rarity})
          AND (${domain}::text IS NULL OR ${domain} = ANY(domains))
          AND (
            ${query} = ''
            OR search_name LIKE '%' || ${query} || '%'
            OR search_name % ${query}
            OR riftbound_id ILIKE '%' || ${query} || '%'
          )
        ORDER BY
          CASE
            WHEN ${query} = '' THEN 0
            WHEN search_name = ${query} THEN 4
            WHEN search_name LIKE ${query} || '%' THEN 3
            WHEN search_name LIKE '%' || ${query} || '%' THEN 2
            ELSE similarity(search_name, ${query})
          END DESC,
          name ASC,
          set_id ASC,
          collector_number ASC
        LIMIT ${size} OFFSET ${offset}
      `,
      sql`
        SELECT count(*)::integer AS total
        FROM cards
        WHERE is_active
          AND (${set}::text IS NULL OR set_id = ${set} OR set_name = ${set})
          AND (${type}::text IS NULL OR type = ${type})
          AND (${rarity}::text IS NULL OR rarity = ${rarity})
          AND (${domain}::text IS NULL OR ${domain} = ANY(domains))
          AND (
            ${query} = ''
            OR search_name LIKE '%' || ${query} || '%'
            OR search_name % ${query}
            OR riftbound_id ILIKE '%' || ${query} || '%'
          )
      `,
    ]);
    const total = count[0]?.total ?? 0;

    return NextResponse.json({
      items,
      total,
      page,
      size,
      pages: Math.ceil(total / size),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to search cards";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizeQuery(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
