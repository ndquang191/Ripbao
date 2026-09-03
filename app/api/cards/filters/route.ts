import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const [sets, types, rarities, domains] = await Promise.all([
      sql`SELECT DISTINCT set_name AS value FROM cards WHERE is_active ORDER BY value`,
      sql`SELECT DISTINCT type AS value FROM cards WHERE is_active ORDER BY value`,
      sql`SELECT DISTINCT rarity AS value FROM cards WHERE is_active ORDER BY value`,
      sql`SELECT DISTINCT unnest(domains) AS value FROM cards WHERE is_active ORDER BY value`,
    ]);

    return NextResponse.json({
      sets: sets.map(({ value }) => value),
      types: types.map(({ value }) => value),
      rarities: rarities.map(({ value }) => value),
      domains: domains.map(({ value }) => value),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load card filters";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
