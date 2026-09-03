import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Collection, type CollectionCard } from "./collection";
import { AccountLink } from "@/components/account-link";
import { TradingLocations } from "./trading-locations";
import { formatCurrency } from "@/lib/currency";
import { getDb } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { UserRound } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { notFound, redirect } from "next/navigation";

const fallbackCards: CollectionCard[] = [
  { id: "jinx-rebel", name: "Jinx, Rebel", set: "Origins", number: "181/221", rarity: "Epic", type: "Champion", faction: "Chaos", finish: "Foil", condition: "Near Mint", price: formatCurrency(1_070_000), quantity: 1, glyph: "✦", gradient: "from-[#b82e96] via-[#663876] to-[#202656]" },
  { id: "ahri-nine-tailed", name: "Ahri, Nine-Tailed", set: "Origins", number: "042/221", rarity: "Rare", type: "Legend", faction: "Calm", finish: "No Foil", condition: "Near Mint", price: formatCurrency(455_000), quantity: 2, glyph: "◈", gradient: "from-[#eeaaaf] via-[#a35d84] to-[#532c72]" },
  { id: "yasuo-unforgiven", name: "Yasuo, Unforgiven", set: "Origins", number: "096/221", rarity: "Epic", type: "Champion", faction: "Calm", finish: "No Foil", condition: "Excellent", price: formatCurrency(788_000), quantity: 1, glyph: "◇", gradient: "from-[#92c5d7] via-[#4e7c8f] to-[#264958]" },
];

async function loadSeller(username: string) {
  const sql = getDb();
  const users = await sql`
    SELECT username, facebook_url AS "facebookUrl"
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
  const cards: CollectionCard[] = rows.map((row) => ({ id: String(row.id), name: String(row.name), set: String(row.set), number: String(row.number).padStart(3, "0"), rarity: String(row.rarity), type: String(row.type), faction: (row.domains as string[])[0] ?? "", domains: row.domains as string[], supertype: row.supertype == null ? null : String(row.supertype), finish: row.finish === "foil" ? "Foil" : "No Foil", condition: String(row.condition), price: Number(row.minPrice) > 0 ? formatCurrency(Number(row.minPrice)) : "Liên hệ", quantity: Number(row.quantity), glyph: "R", gradient: "from-[#91c6bd] via-[#477a78] to-[#283d54]", imageUrl: String(row.imageUrl) }));
  const value = users[0].facebookUrl;
  let facebookUrl: string | null = null;
  if (value) {
    const url = new URL(String(value));
    if (url.protocol === "https:" || url.protocol === "http:") facebookUrl = url.toString();
  }
  return { cards, facebookUrl };
}

function Logo() {
  return (
    <span className="relative block h-9 w-8 rounded-sm border-2 border-accent bg-primary shadow-sm">
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-lg leading-none text-accent">R</span>
    </span>
  );
}

function FacebookIcon() {
  return <span aria-hidden="true" className="grid size-4 place-items-center rounded-full bg-primary font-sans text-[11px] font-black leading-none text-primary-foreground">f</span>;
}

export default async function SellerPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <SellerView username={username} />;
}

export async function SellerView({ username, forceViewer = false, demo = false }: { username: string; forceViewer?: boolean; demo?: boolean }) {
  let displayUsername: string;
  try { displayUsername = decodeURIComponent(username); } catch { notFound(); }
  let seller: Awaited<ReturnType<typeof loadSeller>>;
  let viewer: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    [seller, viewer] = await Promise.all([demo ? Promise.resolve({ cards: fallbackCards, facebookUrl: null }) : loadSeller(displayUsername), getCurrentUser()]);
  } catch {
    redirect("/error");
  }
  if (!seller) notFound();
  const { cards, facebookUrl } = seller;
  const isOwner = !forceViewer && viewer?.username === displayUsername.toLowerCase();

  return (
    <main className="paper-grid min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 lg:py-7">
        <div className="flex items-center justify-between border-b pb-5">
          <Link href="/" className="flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]"><Logo /> RIPBAO</Link>
          <div className="flex items-center gap-2">
            <AccountLink />
          </div>
        </div>

        <section className="border-b py-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <PageTitle icon={UserRound}>@{displayUsername}</PageTitle>
              {facebookUrl && <a href={facebookUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-8")} aria-label={`Mở Facebook của @${displayUsername}`} title="Mở Facebook"><FacebookIcon /></a>}
              <span className="rounded-sm bg-accent px-2 py-1 text-[9px] font-extrabold tracking-wider text-accent-foreground uppercase">Đang bán</span>
            </div>
          </div>
          <div className="mt-4">
            <TradingLocations username={displayUsername} forceViewer={forceViewer} />
          </div>
        </section>

        <section className="py-6">
          <Collection cards={cards} username={displayUsername} facebookUrl={facebookUrl} isOwner={isOwner} />
        </section>
      </div>
    </main>
  );
}
