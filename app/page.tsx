import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AccountLink } from "@/components/account-link";
import { formatCurrency } from "@/lib/currency";
import { getDb } from "@/lib/db";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

type Seller = { username: string; displayName: string; cards: number; rare: number };
type FeaturedCard = { name: string; imageUrl: string; price: number; tcgPercent: number };

async function loadSellers(): Promise<Seller[]> {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT users.username, users.display_name AS "displayName",
        sum(listings.quantity)::integer AS cards,
        sum(listings.quantity) FILTER (
          WHERE cards.rarity IN ('Epic', 'Promo', 'Showcase')
        )::integer AS rare
      FROM users
      JOIN listings ON listings.user_id = users.id
      JOIN cards ON cards.id = listings.card_id
      WHERE listings.is_active AND listings.quantity > 0 AND cards.is_active
      GROUP BY users.id, users.username, users.display_name
      ORDER BY cards DESC, users.username
      LIMIT 4
    `;
    return rows.map((row) => ({
      username: String(row.username),
      displayName: String(row.displayName),
      cards: Number(row.cards),
      rare: Number(row.rare ?? 0),
    }));
  } catch {
    return [];
  }
}

async function loadFeaturedCard(): Promise<FeaturedCard | null> {
  try {
    const sql = getDb();
    const [row] = await sql`
      SELECT cards.name, cards.image_url AS "imageUrl",
        listings.min_price_vnd AS price,
        round(listings.tcg_multiplier * 100)::integer AS "tcgPercent"
      FROM listings
      JOIN cards ON cards.id = listings.card_id
      WHERE listings.is_active AND listings.quantity > 0 AND cards.is_active
      ORDER BY listings.min_price_vnd DESC, cards.name
      LIMIT 1
    `;
    if (!row) return null;
    return {
      name: String(row.name),
      imageUrl: String(row.imageUrl),
      price: Number(row.price),
      tcgPercent: Number(row.tcgPercent),
    };
  } catch {
    return null;
  }
}

function CardArtwork({ featuredCard }: { featuredCard: FeaturedCard | null }) {
  return (
    <div className="relative mx-auto h-[430px] w-full max-w-[470px]" aria-label={featuredCard ? `Card đắt nhất hiện có: ${featuredCard.name}` : "Minh hoạ thẻ bài Riftbound"}>
      <div className="absolute top-1/2 left-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border shadow-[0_0_0_44px_rgba(238,236,227,.6),0_0_0_88px_rgba(238,236,227,.35)]" />
      <div className="absolute top-10 right-4 size-64 rounded-full bg-[#dcedad]/75 blur-sm" />
      <div className="absolute bottom-4 left-5 size-44 rounded-full bg-[#cfdee4]/60 blur-sm" />
      <div className="absolute top-10 left-1/2 h-[322px] w-[222px] -translate-x-[22%] rotate-[12deg] rounded-lg border-4 border-[#76966e] bg-primary shadow-2xl">
        <span className="grid h-full place-items-center font-serif text-8xl text-accent/35">R</span>
      </div>
      <div className="absolute top-8 left-1/2 h-[330px] w-[230px] -translate-x-[70%] -rotate-[7deg] overflow-hidden rounded-lg border-[3px] border-[#b49d63] bg-[#e9dfbd] shadow-2xl">
        {featuredCard ? <img src={featuredCard.imageUrl} alt={featuredCard.name} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-serif text-8xl text-primary/30">R</span>}
      </div>
      <Card className="absolute right-0 bottom-12 z-20 min-w-[220px] border-l-[3px] border-l-accent shadow-xl">
        <CardContent className="p-3.5">
          <span className="block text-[8px] font-bold tracking-wider text-muted-foreground uppercase">Bạn có rất nhiều tiền ?</span>
          <div className="mt-0.5 flex items-end justify-between gap-3">
            <strong className="whitespace-nowrap font-serif text-2xl">{featuredCard ? formatCurrency(featuredCard.price) : "Chưa có giá"}</strong>
            {featuredCard && <b className="shrink-0 pb-1 text-[9px] text-[#65982e]">{featuredCard.tcgPercent}% TCG</b>}
          </div>
        </CardContent>
      </Card>
      <span className="absolute top-16 right-0 text-3xl text-[#90a967]">✦</span><span className="absolute bottom-8 left-14 text-xl text-[#90a967]">✧</span>
    </div>
  );
}

export default async function Home() {
  const [sellers, featuredCard] = await Promise.all([loadSellers(), loadFeaturedCard()]);
  return (
    <main className="paper-grid min-h-dvh overflow-x-hidden">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:py-7">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]">
            <BrandLogo />
            RIPBAO
          </Link>
          <div className="flex justify-self-end gap-2"><AccountLink /></div>
        </div>

        <section className="grid flex-1 items-center gap-8 py-5 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:py-2">
          <div>
            <form action="/search" className="relative mb-5" role="search">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" required className="h-11 bg-card/95 pr-23 pl-10 shadow-sm" placeholder="Bạn cần tìm card, set hoặc mã card nào?" aria-label="Tìm collection đang bán card" />
              <button type="submit" className={cn(buttonVariants({ size: "sm" }), "absolute top-1.5 right-1.5 h-8")}>Tìm</button>
            </form>
            <div className="mb-4 flex items-end justify-between">
              <div><h1 className="font-serif text-2xl font-semibold leading-none tracking-[-0.02em] text-[#5f793f]">Khám phá bộ sưu tập</h1></div>
              <span className="hidden text-xs text-muted-foreground sm:block">{sellers.length} collection đang bán</span>
            </div>
            <div className="grid gap-2.5">
              {sellers.map((seller, index) => (
                <Link href={`/u/${seller.username}`} key={seller.username} className="group">
                  <Card className={cn("transition-all group-hover:translate-x-1 group-hover:border-[#8ba55e] group-hover:shadow-md", index === 0 && "border-primary bg-primary text-primary-foreground")}>
                    <CardContent className="flex items-center gap-4 p-3.5">
                      <img src={`https://api.dicebear.com/10.x/critters/svg?scale=0.94&borderRadius=50&seed=${encodeURIComponent(seller.displayName)}`} alt={`Avatar của ${seller.displayName}`} className="size-11 shrink-0 rounded-full border bg-secondary object-cover" loading="lazy" decoding="async" />
                      <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-extrabold">{seller.displayName}</h2><p className={cn("mt-1 truncate text-[10px] text-muted-foreground", index === 0 && "text-white/60")}>{seller.cards} card · {seller.rare} card hiếm</p></div>
                      <ArrowUpRight className={cn("size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", index === 0 && "text-accent")} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {sellers.length === 0 && <Card className="border-dashed bg-card/70"><CardContent className="p-6 text-center"><p className="font-serif text-lg font-semibold">Chưa có collection đang bán</p><p className="mt-1 text-xs text-muted-foreground">Hãy trở thành người đầu tiên đăng collection trên Ripbao.</p></CardContent></Card>}
            </div>
            <Card className="mt-2.5 border-dashed bg-secondary/75"><CardContent className="flex items-center justify-between gap-5 p-3.5"><div><strong className="text-sm">Bạn cũng có một bộ sưu tập?</strong><p className="mt-0.5 text-[10px] text-muted-foreground">Tạo trang riêng và chia sẻ card của bạn.</p></div><Link href="/register" className={cn(buttonVariants({ variant: "accent", size: "sm" }), "shrink-0")}>Tạo miễn phí <ArrowUpRight className="size-3.5" /></Link></CardContent></Card>
          </div>
          <div className="hidden lg:block"><CardArtwork featuredCard={featuredCard} /></div>
        </section>

        <div className="flex items-center justify-between border-t pt-3 text-[9px] text-muted-foreground"><span>© 2026 Ripbao</span><span>Không liên kết với Riot Games · Giá chỉ mang tính tham khảo</span></div>
      </div>
    </main>
  );
}
