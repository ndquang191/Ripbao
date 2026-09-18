import { neon } from "@neondatabase/serverless";

const API_URL = "https://api.justtcg.com/v1/cards";
const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 3;

type Finish = "nonfoil" | "foil";
type ActiveCard = { id: string; tcgplayerId: string };
export type PriceLookupItem = { cardId: string; finish: Finish };
export type PriceUpdate = PriceLookupItem & {
  marketPriceUsd: number;
  sourceUpdatedAt: string;
};
type JustTcgVariant = {
  uuid?: string;
  id?: string;
  condition?: string;
  printing?: string;
  language?: string | null;
  tcgplayerSkuId?: string | null;
  price?: number;
  lastUpdated?: number;
};
type JustTcgCard = { tcgplayerId?: string; variants?: JustTcgVariant[] };
type JustTcgResponse = {
  data?: JustTcgCard[];
  error?: string;
  code?: string;
  _metadata?: { apiRateLimit?: number };
};
type BatchResult = { cards: JustTcgCard[]; rateLimit: number | null };

export type PriceSyncResult = {
  cards: number;
  batches: number;
  prices: number;
  missingCards: number;
};

export function priceBatchCount(cardCount: number) {
  return Math.ceil(Math.max(0, cardCount) / BATCH_SIZE);
}

export function finishFromPrinting(printing?: string): Finish | null {
  const value = printing?.trim().toLowerCase();
  if (value === "normal") return "nonfoil";
  if (value === "foil") return "foil";
  return null;
}

export function roundDynamicPrice(
  minimumVnd: number,
  marketPriceUsd: number | null | undefined,
  multiplier: number,
) {
  if (marketPriceUsd == null) return Math.max(0, Math.round(minimumVnd));
  const tcgPrice = Math.ceil(marketPriceUsd * multiplier) * 1_000;
  return Math.max(Math.max(0, Math.round(minimumVnd)), tcgPrice);
}

function requiredPositiveNumber(name: string) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${name} must be configured as a positive number`);
  return value;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBatch(apiKey: string, cards: ActiveCard[]): Promise<BatchResult> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(cards.map((card) => ({
        tcgplayerId: card.tcgplayerId,
        condition: "NM",
        language: "English",
      }))),
    });
    if (response.ok) {
      const payload = (await response.json()) as JustTcgResponse;
      const rateLimit = Number(payload._metadata?.apiRateLimit);
      return {
        cards: payload.data ?? [],
        rateLimit: Number.isFinite(rateLimit) && rateLimit > 0 ? rateLimit : null,
      };
    }
    const body = await response.json().catch(() => null) as JustTcgResponse | null;
    const detail = body?.code ?? body?.error;
    if (attempt === MAX_ATTEMPTS || (response.status !== 429 && response.status < 500))
      throw new Error(
        `JustTCG returned ${response.status} ${response.statusText}` +
          (detail ? ` (${detail})` : ""),
      );
    const retryAfter = Number(response.headers.get("retry-after"));
    await delay(Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1_000
      : response.status === 429
        ? 30_000
        : 1_000 * 2 ** (attempt - 1));
  }
  return { cards: [], rateLimit: null };
}

function latestPrices(card: JustTcgCard) {
  const result = new Map<Finish, JustTcgVariant>();
  for (const variant of card.variants ?? []) {
    const finish = finishFromPrinting(variant.printing);
    const language = variant.language?.trim().toLowerCase();
    if (!finish || variant.condition?.trim().toLowerCase() !== "near mint" ||
      (language && language !== "english") || !Number.isFinite(variant.price) ||
      Number(variant.price) < 0 || !Number.isFinite(variant.lastUpdated)) continue;
    const current = result.get(finish);
    if (!current || Number(variant.lastUpdated) > Number(current.lastUpdated))
      result.set(finish, variant);
  }
  return result;
}

function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return neon(connectionString);
}

async function syncCards(cards: ActiveCard[]): Promise<PriceSyncResult> {
  if (!cards.length)
    return { cards: 0, batches: 0, prices: 0, missingCards: 0 };
  const apiKey = process.env.JUSTTCG_API_KEY?.trim();
  if (!apiKey) throw new Error("JUSTTCG_API_KEY is not configured");
  const usdToVnd = requiredPositiveNumber("USD_TO_VND");
  const sql = database();
  let priceCount = 0;
  let missingCards = 0;
  for (let offset = 0; offset < cards.length; offset += BATCH_SIZE) {
    const batch = cards.slice(offset, offset + BATCH_SIZE);
    const { cards: responseCards, rateLimit } = await fetchBatch(apiKey, batch);
    const requested = new Map(batch.map((card) => [card.tcgplayerId, card]));
    const prices = responseCards.flatMap((responseCard) => {
      const card = requested.get(String(responseCard.tcgplayerId ?? ""));
      if (!card) return [];
      return [...latestPrices(responseCard)].map(([finish, variant]) => ({
        card_id: card.id,
        finish,
        market_price_usd: Number(variant.price),
        market_price_vnd: Math.round(Number(variant.price) * usdToVnd),
        usd_to_vnd: usdToVnd,
        source_variant_id: variant.uuid ?? variant.id ?? null,
        source_sku_id: variant.tcgplayerSkuId ?? null,
        source_updated_at: new Date(Number(variant.lastUpdated) * 1_000).toISOString(),
      }));
    });
    const cardsWithPrices = new Set(prices.map((price) => price.card_id));
    missingCards += batch.filter((card) => !cardsWithPrices.has(card.id)).length;
    if (prices.length) {
      const payload = JSON.stringify(prices);
      await sql`
        INSERT INTO card_market_prices (
          card_id, finish, market_price_usd, market_price_vnd, usd_to_vnd,
          source_variant_id, source_sku_id, source_updated_at, synced_at
        )
        SELECT item.card_id, item.finish, item.market_price_usd, item.market_price_vnd,
          item.usd_to_vnd, item.source_variant_id, item.source_sku_id,
          item.source_updated_at, now()
        FROM jsonb_to_recordset(${payload}::jsonb) AS item(
          card_id text, finish text, market_price_usd numeric, market_price_vnd bigint,
          usd_to_vnd numeric, source_variant_id text, source_sku_id text,
          source_updated_at timestamptz
        )
        ON CONFLICT (card_id, finish) DO UPDATE SET
          market_price_usd = EXCLUDED.market_price_usd,
          market_price_vnd = EXCLUDED.market_price_vnd,
          usd_to_vnd = EXCLUDED.usd_to_vnd,
          source_variant_id = EXCLUDED.source_variant_id,
          source_sku_id = EXCLUDED.source_sku_id,
          source_updated_at = EXCLUDED.source_updated_at,
          synced_at = now()
      `;
      priceCount += prices.length;
    }
    if (offset + BATCH_SIZE < cards.length) {
      const requestsPerMinute = rateLimit ?? 10;
      await delay(Math.ceil(60_000 / requestsPerMinute) + 250);
    }
  }
  return { cards: cards.length, batches: priceBatchCount(cards.length), prices: priceCount, missingCards };
}

export async function syncActiveListingPrices(): Promise<PriceSyncResult> {
  const sql = database();
  const rows = await sql`
    SELECT DISTINCT cards.id, cards.tcgplayer_id AS "tcgplayerId"
    FROM cards JOIN listings ON listings.card_id = cards.id
    WHERE cards.is_active AND cards.tcgplayer_id IS NOT NULL
      AND listings.is_active AND listings.quantity > 0
    ORDER BY cards.id
  `;
  const cards = rows.map((row) => ({ id: String(row.id), tcgplayerId: String(row.tcgplayerId) }));
  return syncCards(cards);
}

export async function syncMissingListingPricesForUser(userId: number) {
  const sql = database();
  const rows = await sql`
    SELECT DISTINCT cards.id, cards.tcgplayer_id AS "tcgplayerId"
    FROM listings
    JOIN cards ON cards.id = listings.card_id
    LEFT JOIN card_market_prices AS prices
      ON prices.card_id = listings.card_id AND prices.finish = listings.finish
    WHERE listings.user_id = ${userId}
      AND listings.is_active
      AND listings.quantity > 0
      AND cards.is_active
      AND cards.tcgplayer_id IS NOT NULL
      AND prices.card_id IS NULL
    ORDER BY cards.id
  `;
  return syncCards(rows.map((row) => ({
    id: String(row.id),
    tcgplayerId: String(row.tcgplayerId),
  })));
}

export async function syncMissingCardPrices(items: PriceLookupItem[]) {
  const uniqueItems = [...new Map(
    items.map((item) => [`${item.finish}:${item.cardId}`, item]),
  ).values()];
  if (!uniqueItems.length)
    return { result: await syncCards([]), priceUpdates: [] as PriceUpdate[] };

  const sql = database();
  const payload = JSON.stringify(uniqueItems.map((item) => ({
    card_id: item.cardId,
    finish: item.finish,
  })));
  const missingRows = await sql`
    SELECT DISTINCT cards.id, cards.tcgplayer_id AS "tcgplayerId"
    FROM jsonb_to_recordset(${payload}::jsonb) AS requested(card_id text, finish text)
    JOIN cards ON cards.id = requested.card_id AND cards.is_active
    LEFT JOIN card_market_prices AS prices
      ON prices.card_id = requested.card_id AND prices.finish = requested.finish
    WHERE cards.tcgplayer_id IS NOT NULL AND prices.card_id IS NULL
    ORDER BY cards.id
  `;
  const result = await syncCards(missingRows.map((row) => ({
    id: String(row.id),
    tcgplayerId: String(row.tcgplayerId),
  })));
  const priceRows = await sql`
    SELECT requested.card_id AS "cardId", requested.finish,
      prices.market_price_usd::float8 AS "marketPriceUsd",
      prices.source_updated_at AS "sourceUpdatedAt"
    FROM jsonb_to_recordset(${payload}::jsonb) AS requested(card_id text, finish text)
    JOIN card_market_prices AS prices
      ON prices.card_id = requested.card_id AND prices.finish = requested.finish
  `;
  return {
    result,
    priceUpdates: priceRows.map((row) => ({
      cardId: String(row.cardId),
      finish: row.finish === "foil" ? "foil" as const : "nonfoil" as const,
      marketPriceUsd: Number(row.marketPriceUsd),
      sourceUpdatedAt: String(row.sourceUpdatedAt),
    })),
  };
}
