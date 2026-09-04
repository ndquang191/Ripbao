import Link from "next/link";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import { AccountLink } from "@/components/account-link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";
import { getDb } from "@/lib/db";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type MatchingCard = {
  id: string;
  name: string;
  set: string;
  number: number;
  rarity: string;
  imageUrl: string;
  finish: string;
  condition: string;
  quantity: number;
  minPrice: number;
};

type CollectionResult = {
  username: string;
  displayName: string;
  tradingLocations: string[];
  cards: MatchingCard[];
};

function normalizeQuery(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function searchCollections(rawQuery: string): Promise<CollectionResult[]> {
  const query = normalizeQuery(rawQuery);
  if (!query) return [];
  const collectorNumber = /^\d+(?:\s*\/\s*\d+)?$/.test(rawQuery) ? rawQuery.split("/")[0].trim() : "";

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT users.username, users.display_name AS "displayName",
        COALESCE((
          SELECT array_agg(preference.name ORDER BY
            CASE WHEN preference.option_id IS NULL THEN 0 ELSE 1 END,
            preference.position,
            preference.id
          )
          FROM user_trading_preferences AS preference
          WHERE preference.user_id = users.id
            AND preference.enabled
            AND (
              preference.option_id IS NULL
              OR preference.option_id IN ('ship-inner-city', 'ship-nationwide')
            )
        ), ARRAY[]::text[]) AS "tradingLocations",
        cards.id, cards.name, cards.set_name AS "set", cards.collector_number AS number,
        cards.rarity, cards.image_url AS "imageUrl", listings.finish, listings.condition,
        listings.quantity, listings.min_price_vnd AS "minPrice"
      FROM listings
      JOIN users ON users.id = listings.user_id
      JOIN cards ON cards.id = listings.card_id
      WHERE listings.is_active AND listings.quantity > 0 AND cards.is_active
        AND (
          cards.search_name LIKE '%' || ${query} || '%'
          OR cards.search_name % ${query}
          OR lower(cards.set_name) LIKE '%' || ${query} || '%'
          OR lower(cards.riftbound_id) LIKE '%' || ${query} || '%'
          OR (${collectorNumber} <> '' AND cards.collector_number::text = ${collectorNumber})
        )
      ORDER BY users.username, cards.name, cards.set_name, cards.collector_number,
        listings.min_price_vnd, listings.finish, listings.condition
      LIMIT 200
    `;

    const collections = new Map<string, CollectionResult>();
    for (const row of rows) {
      const username = String(row.username);
      const collection = collections.get(username) ?? {
        username,
        displayName: String(row.displayName),
        tradingLocations: Array.isArray(row.tradingLocations) ? row.tradingLocations.map(String) : [],
        cards: [],
      };
      collection.cards.push({
        id: String(row.id),
        name: String(row.name),
        set: String(row.set),
        number: Number(row.number),
        rarity: String(row.rarity),
        imageUrl: String(row.imageUrl),
        finish: String(row.finish),
        condition: String(row.condition),
        quantity: Number(row.quantity),
        minPrice: Number(row.minPrice),
      });
      collections.set(username, collection);
    }

    return [...collections.values()].sort((a, b) => b.cards.length - a.cards.length || a.displayName.localeCompare(b.displayName, "vi"));
  } catch {
    return [];
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const value = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = value?.trim().slice(0, 100) ?? "";
  const collections = await searchCollections(query);
  const matchingCards = collections.reduce((total, collection) => total + collection.cards.length, 0);

  return (
    <main className="paper-grid min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 lg:py-7">
        <header className="flex items-center justify-between border-b pb-5">
          <Link href="/" className="flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]"><BrandLogo /> RIPBAO</Link>
          <AccountLink />
        </header>

        <section className="py-7">
          <form action="/search" className="relative max-w-3xl" role="search">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" required defaultValue={query} autoFocus className="h-12 bg-card pr-24 pl-10 shadow-sm" placeholder="Bạn cần tìm card, set hoặc mã card nào?" aria-label="Tìm collection đang bán card" />
            <button type="submit" className={cn(buttonVariants({ size: "sm" }), "absolute top-2 right-2 h-8")}>Tìm</button>
          </form>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-[#5f793f]">{query ? `Kết quả cho “${query}”` : "Tìm card đang bán"}</h1>
              {query && <p className="mt-1 text-xs text-muted-foreground">{collections.length} collection · {matchingCards} lựa chọn phù hợp</p>}
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {collections.map((collection) => (
              <Card key={collection.username} className="overflow-hidden bg-card">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
                    <img src={`https://api.dicebear.com/10.x/critters/svg?scale=0.94&borderRadius=50&seed=${encodeURIComponent(collection.displayName)}`} alt="" className="size-9 rounded-full border bg-card" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-extrabold">{collection.displayName}</h2>
                      <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-[10px] text-muted-foreground"><MapPin className="size-3 shrink-0" /><span className="truncate">{collection.tradingLocations.length > 0 ? collection.tradingLocations.join(" · ") : "Chưa cập nhật địa điểm giao dịch"}</span></p>
                    </div>
                    <Link href={`/u/${collection.username}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-card")}>Xem collection <ArrowUpRight className="size-3.5" /></Link>
                  </div>
                  <div className="grid gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
                    {collection.cards.map((card, index) => (
                      <div key={`${card.id}-${card.finish}-${card.condition}-${index}`} className="flex min-w-0 gap-3 bg-card p-3">
                        <img src={card.imageUrl} alt={card.name} loading="lazy" decoding="async" className="h-24 w-[68px] shrink-0 rounded-sm border bg-secondary object-cover" />
                        <div className="flex min-w-0 flex-1 flex-col py-0.5">
                          <h3 className="line-clamp-2 text-xs font-extrabold leading-4">{card.name}</h3>
                          <p className="mt-1 truncate text-[10px] text-muted-foreground">{card.set} · {String(card.number).padStart(3, "0")} · {card.rarity}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{card.finish === "foil" ? "Foil" : "Non-foil"} · {card.condition} · SL {card.quantity}</p>
                          <strong className="mt-auto text-xs text-[#5f793f]">{card.minPrice > 0 ? formatCurrency(card.minPrice) : "Liên hệ"}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {query && collections.length === 0 && <Card className="border-dashed bg-card/70"><CardContent className="p-10 text-center"><Search className="mx-auto size-7 text-muted-foreground" /><h2 className="mt-3 font-serif text-lg font-semibold">Chưa có collection bán card này</h2><p className="mt-1 text-xs text-muted-foreground">Thử lại bằng tên card, tên set hoặc mã card khác.</p></CardContent></Card>}
          </div>
        </section>
      </div>
    </main>
  );
}
