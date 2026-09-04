import { neon } from "@neondatabase/serverless";

const API_BASE_URL = "https://api.riftcodex.com";
const PAGE_SIZE = 100;

type ApiCard = {
  id: string;
  riftbound_id: string;
  tcgplayer_id: string | null;
  name: string;
  collector_number: number;
  set: { set_id: string; label: string };
  classification: {
    domain: string[];
    type: string;
    supertype: string | null;
    rarity: string;
  };
  media: { image_url: string };
  metadata: { updated_on?: string | null };
};

type ApiPage = {
  items: ApiCard[];
  pages: number;
  total: number;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured");

async function getPage(page: number): Promise<ApiPage> {
  const response = await fetch(
    `${API_BASE_URL}/cards?page=${page}&size=${PAGE_SIZE}&sort=name&dir=1`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error(
      `RiftCodex returned ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<ApiPage>;
}

function normalizeSearchName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const firstPage = await getPage(1);
const remainingPages: ApiPage[] = [];

for (let start = 2; start <= firstPage.pages; start += 5) {
  const pageNumbers = Array.from(
    { length: Math.min(5, firstPage.pages - start + 1) },
    (_, index) => start + index,
  );
  remainingPages.push(...(await Promise.all(pageNumbers.map(getPage))));
}

const sourceCards = [firstPage, ...remainingPages]
  .flatMap((page) => page.items)
  .filter((card) => card.classification.type.toLowerCase() !== "battlefield");

const uniqueCards = new Map<string, ApiCard>();
for (const card of sourceCards.sort((left, right) =>
  left.id.localeCompare(right.id),
)) {
  if (!uniqueCards.has(card.riftbound_id))
    uniqueCards.set(card.riftbound_id, card);
}

const cards = [...uniqueCards.values()].map((card) => ({
  id: card.id,
  riftbound_id: card.riftbound_id,
  tcgplayer_id: card.tcgplayer_id,
  name: card.name,
  search_name: normalizeSearchName(card.name),
  collector_number: card.collector_number,
  set_id: card.set.set_id,
  set_name: card.set.label,
  type: card.classification.type,
  supertype: card.classification.supertype,
  rarity: card.classification.rarity,
  domains: card.classification.domain,
  image_url: card.media.image_url,
  source_updated_at: card.metadata.updated_on ?? null,
}));

const sql = neon(connectionString);
const payload = JSON.stringify(cards);

await sql.transaction((tx) => [
  tx`UPDATE cards SET is_active = false`,
  tx`
    INSERT INTO cards (
      id, riftbound_id, tcgplayer_id, name, search_name, collector_number,
      set_id, set_name, type, supertype, rarity, domains, image_url,
      source_updated_at, synced_at, is_active
    )
    SELECT
      item.id, item.riftbound_id, item.tcgplayer_id, item.name,
      item.search_name, item.collector_number, item.set_id, item.set_name,
      item.type, item.supertype, item.rarity, item.domains, item.image_url,
      item.source_updated_at, now(), true
    FROM jsonb_to_recordset(${payload}::jsonb) AS item(
      id text, riftbound_id text, tcgplayer_id text, name text,
      search_name text, collector_number integer, set_id text, set_name text,
      type text, supertype text, rarity text, domains text[], image_url text,
      source_updated_at timestamptz
    )
    ON CONFLICT (riftbound_id) DO UPDATE SET
      tcgplayer_id = EXCLUDED.tcgplayer_id,
      name = EXCLUDED.name,
      search_name = EXCLUDED.search_name,
      collector_number = EXCLUDED.collector_number,
      set_id = EXCLUDED.set_id,
      set_name = EXCLUDED.set_name,
      type = EXCLUDED.type,
      supertype = EXCLUDED.supertype,
      rarity = EXCLUDED.rarity,
      domains = EXCLUDED.domains,
      image_url = EXCLUDED.image_url,
      source_updated_at = EXCLUDED.source_updated_at,
      synced_at = now(),
      is_active = true
  `,
]);

console.log(
  `Synced ${cards.length} unique Riftbound cards ` +
    `(${sourceCards.length} non-Battlefield records from ${firstPage.total} total)`,
);
