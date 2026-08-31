import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Collection, type CollectionCard } from "./collection";
import { AccountLink } from "@/components/account-link";
import { getAllCards, type RiftboundCard } from "@/lib/riftbound";
import { TradingLocations } from "./trading-locations";
import { formatCurrency } from "@/lib/currency";

const fallbackCards: CollectionCard[] = [
  { id: "jinx-rebel", name: "Jinx, Rebel", set: "Origins", number: "181/221", rarity: "Epic", type: "Champion", faction: "Chaos", finish: "Foil", condition: "Near Mint", price: formatCurrency(1_070_000), quantity: 1, glyph: "✦", gradient: "from-[#b82e96] via-[#663876] to-[#202656]" },
  { id: "ahri-nine-tailed", name: "Ahri, Nine-Tailed", set: "Origins", number: "042/221", rarity: "Rare", type: "Legend", faction: "Calm", finish: "No Foil", condition: "Near Mint", price: formatCurrency(455_000), quantity: 2, glyph: "◈", gradient: "from-[#eeaaaf] via-[#a35d84] to-[#532c72]" },
  { id: "yasuo-unforgiven", name: "Yasuo, Unforgiven", set: "Origins", number: "096/221", rarity: "Epic", type: "Champion", faction: "Calm", finish: "No Foil", condition: "Excellent", price: formatCurrency(788_000), quantity: 1, glyph: "◇", gradient: "from-[#92c5d7] via-[#4e7c8f] to-[#264958]" },
];

function toCollectionCard(card: RiftboundCard): CollectionCard {
  return {
    id: card.id,
    name: card.name,
    set: card.set,
    number: String(card.collectorNumber).padStart(3, "0"),
    rarity: card.rarity,
    type: card.type,
    faction: card.domain[0] ?? "",
    domains: card.domain,
    supertype: card.supertype,
    isNew: card.isNew,
    finish: "No Foil",
    condition: "Chưa cập nhật",
    price: "Liên hệ",
    quantity: 1,
    glyph: "R",
    gradient: "from-[#91c6bd] via-[#477a78] to-[#283d54]",
    imageUrl: card.imageUrl,
  };
}

async function loadCards() {
  try {
    const cards = await getAllCards();
    return { cards: uniqueCardsByName(cards.map(toCollectionCard)), usingFallback: false };
  } catch {
    return { cards: fallbackCards, usingFallback: true };
  }
}

function uniqueCardsByName(cards: CollectionCard[]) {
  const names = new Set<string>();

  return cards.filter((card) => {
    const name = card.name.trim().toLocaleLowerCase("en");
    if (names.has(name)) return false;
    names.add(name);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
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

async function SellerView({ username, forceViewer = false }: { username: string; forceViewer?: boolean }) {
  const displayUsername = decodeURIComponent(username);
  const { cards, usingFallback } = await loadCards();

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
              <h1 className="font-serif text-3xl font-semibold tracking-tight">@{displayUsername}</h1>
              <Button variant="outline" size="icon" className="size-8" aria-label="Nhắn tin qua Facebook" title="Nhắn tin qua Facebook"><FacebookIcon /></Button>
              <span className="rounded-sm bg-accent px-2 py-1 text-[9px] font-extrabold tracking-wider text-accent-foreground uppercase">Đang bán</span>
            </div>
          </div>
          <div className="mt-4">
            <TradingLocations username={displayUsername} forceViewer={forceViewer} />
          </div>
        </section>

        <section className="py-6">
          {usingFallback && <p className="mb-3 rounded-sm border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] text-amber-900">Đang hiển thị dữ liệu mẫu vì Riftbound API chưa được cấu hình hoặc tạm thời không khả dụng.</p>}
          <Collection cards={cards} username={displayUsername} />
        </section>
      </div>
    </main>
  );
}
