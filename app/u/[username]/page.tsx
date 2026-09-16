import type { Metadata } from "next";
import { cache } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Collection, type CollectionCard } from "./collection";
import { SiteHeader } from "@/components/site-header";
import { TradingLocations } from "./trading-locations";
import { formatCurrency } from "@/lib/currency";
import { getDb } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { UserRound } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { notFound, redirect } from "next/navigation";

const loadSeller = cache(async (username: string) => {
  const sql = getDb();
  const users = await sql`
    SELECT username, display_name AS "displayName", facebook_url AS "facebookUrl"
    FROM users
    WHERE username = ${username.toLowerCase()}
    LIMIT 1
  `;
  if (!users[0]) return null;

  const rows = await sql`
      SELECT cards.id, cards.name, cards.set_name AS "set", cards.collector_number AS number,
        cards.rarity, cards.type, cards.domains, cards.supertype, cards.image_url AS "imageUrl",
        listings.finish, listings.condition, listings.quantity, listings.min_price_vnd AS "minPrice"
      FROM listings
      JOIN users ON users.id = listings.user_id
      JOIN cards ON cards.id = listings.card_id
      WHERE users.username = ${username.toLowerCase()} AND listings.is_active AND listings.quantity > 0
      ORDER BY cards.name
  `;
  const cards: CollectionCard[] = rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    set: String(row.set),
    number: String(row.number).padStart(3, "0"),
    rarity: String(row.rarity),
    type: String(row.type),
    faction: (row.domains as string[])[0] ?? "",
    domains: row.domains as string[],
    supertype: row.supertype == null ? null : String(row.supertype),
    finish: row.finish === "foil" ? "Foil" : "No Foil",
    condition: String(row.condition),
    price:
      Number(row.minPrice) > 0
        ? formatCurrency(Number(row.minPrice))
        : "Liên hệ",
    quantity: Number(row.quantity),
    glyph: "R",
    gradient: "from-[#91c6bd] via-[#477a78] to-[#283d54]",
    imageUrl: String(row.imageUrl),
  }));
  const value = users[0].facebookUrl;
  let facebookUrl: string | null = null;
  if (value) {
    const url = new URL(String(value));
    if (url.protocol === "https:" || url.protocol === "http:")
      facebookUrl = url.toString();
  }
  return { cards, displayName: String(users[0].displayName), facebookUrl };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  try {
    const username = decodeURIComponent((await params).username).toLowerCase();
    const seller = await loadSeller(username);
    if (!seller) return { title: "Không tìm thấy collection" };
    const description = `Xem ${seller.cards.length} loại card Riftbound trong collection của ${seller.displayName} trên Ripbao.`;
    const path = `/u/${encodeURIComponent(username)}`;
    return {
      title: `Collection của ${seller.displayName}`,
      description,
      alternates: { canonical: path },
      openGraph: {
        type: "profile",
        title: `Collection của ${seller.displayName}`,
        description,
        url: path,
        images: seller.cards[0]?.imageUrl
          ? [{ url: seller.cards[0].imageUrl, alt: seller.cards[0].name }]
          : undefined,
      },
      twitter: {
        card: seller.cards[0]?.imageUrl ? "summary_large_image" : "summary",
        title: `Collection của ${seller.displayName}`,
        description,
        images: seller.cards[0]?.imageUrl
          ? [seller.cards[0].imageUrl]
          : undefined,
      },
    };
  } catch {
    return { title: "Collection" };
  }
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 text-primary"
    >
      <circle cx="12" cy="12" r="12" fill="currentColor" />
      <path
        fill="white"
        d="M13.55 21v-8.2h2.75l.41-3.2h-3.16V7.56c0-.93.26-1.56 1.59-1.56h1.7V3.14A22.8 22.8 0 0 0 14.36 3c-2.45 0-4.13 1.5-4.13 4.24V9.6H7.46v3.2h2.77V21h3.32Z"
      />
    </svg>
  );
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  let displayUsername: string;
  try {
    displayUsername = decodeURIComponent(username);
  } catch {
    notFound();
  }
  let seller: Awaited<ReturnType<typeof loadSeller>>;
  let viewer: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    [seller, viewer] = await Promise.all([
      loadSeller(displayUsername),
      getCurrentUser(),
    ]);
  } catch {
    redirect("/error");
  }
  if (!seller) notFound();
  const { cards, displayName, facebookUrl } = seller;
  const isOwner = viewer?.username === displayUsername.toLowerCase();

  return (
    <main className="paper-grid min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-8 lg:py-7">
        <SiteHeader />

        <section className="border-b py-5 sm:py-7">
          <div>
            <div className="inline-flex max-w-full items-center gap-3 rounded-lg border border-[#8ba55e] border-l-4 bg-[#edf3e5] px-4 py-3 shadow-sm">
              <PageTitle
                icon={UserRound}
                className="min-w-0 [&_h1]:text-[#40572b] [&_h1]:[overflow-wrap:anywhere]"
              >
                {displayName}
              </PageTitle>
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "size-11 shrink-0 border-primary/30 bg-card hover:border-primary/55 hover:bg-secondary sm:size-8",
                  )}
                  aria-label={`Mở Facebook của ${displayName}`}
                  title="Mở Facebook"
                >
                  <FacebookIcon />
                </a>
              )}
            </div>
          </div>
          <div className="mt-4">
            <TradingLocations username={displayUsername} />
          </div>
        </section>

        <section className="py-6">
          <Collection
            cards={cards}
            username={displayUsername}
            displayName={displayName}
            facebookUrl={facebookUrl}
            isOwner={isOwner}
          />
        </section>
      </div>
    </main>
  );
}
