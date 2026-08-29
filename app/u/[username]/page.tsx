import Link from "next/link";
import { ArrowLeft, ExternalLink, Filter, Search, SlidersHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const cards = [
  { id: "jinx-rebel", name: "Jinx, Rebel", set: "Origins", number: "181/221", rarity: "Epic", finish: "Foil", condition: "Near Mint", price: "$42.80", quantity: 1, glyph: "✦", gradient: "from-[#b82e96] via-[#663876] to-[#202656]" },
  { id: "ahri-nine-tailed", name: "Ahri, Nine-Tailed", set: "Origins", number: "042/221", rarity: "Rare", finish: "Normal", condition: "Near Mint", price: "$18.20", quantity: 2, glyph: "◈", gradient: "from-[#eeaaaf] via-[#a35d84] to-[#532c72]" },
  { id: "yasuo-unforgiven", name: "Yasuo, Unforgiven", set: "Origins", number: "096/221", rarity: "Epic", finish: "Normal", condition: "Excellent", price: "$31.50", quantity: 1, glyph: "◇", gradient: "from-[#92c5d7] via-[#4e7c8f] to-[#264958]" },
  { id: "teemo-scout", name: "Teemo, Scout", set: "Origins", number: "117/221", rarity: "Rare", finish: "Foil", condition: "Near Mint", price: "$14.90", quantity: 3, glyph: "❋", gradient: "from-[#b7d481] via-[#6b9658] to-[#395f37]" },
  { id: "lux-illuminated", name: "Lux, Illuminated", set: "Origins", number: "012/221", rarity: "Rare", finish: "Normal", condition: "Near Mint", price: "$12.40", quantity: 1, glyph: "✧", gradient: "from-[#f1d993] via-[#d09b5e] to-[#674a5e]" },
  { id: "viktor-innovator", name: "Viktor, Innovator", set: "Origins", number: "154/221", rarity: "Epic", finish: "Foil", condition: "Near Mint", price: "$26.70", quantity: 1, glyph: "⬡", gradient: "from-[#91c6bd] via-[#477a78] to-[#283d54]" },
  { id: "annie-dark-child", name: "Annie, Dark Child", set: "Origins", number: "063/221", rarity: "Rare", finish: "Normal", condition: "Good", price: "$9.80", quantity: 2, glyph: "✺", gradient: "from-[#e79b74] via-[#a74d4d] to-[#4e293c]" },
  { id: "miss-fortune", name: "Miss Fortune", set: "Origins", number: "202/221", rarity: "Epic", finish: "Normal", condition: "Near Mint", price: "$22.10", quantity: 1, glyph: "✥", gradient: "from-[#e9b065] via-[#a64d48] to-[#47334e]" },
];

function Logo() {
  return (
    <span className="relative block h-9 w-8 rounded-sm border-2 border-accent bg-primary shadow-sm">
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-lg leading-none text-accent">R</span>
    </span>
  );
}

export default async function SellerPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const displayUsername = decodeURIComponent(username);

  return (
    <main className="paper-grid min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 lg:py-7">
        <div className="flex items-center justify-between border-b pb-5">
          <Link href="/" className="flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]"><Logo /> RIPBAO</Link>
          <div className="flex items-center gap-2">
            <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}><ArrowLeft className="size-3.5" /> Trang chủ</Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>Đăng nhập</Link>
          </div>
        </div>

        <section className="grid gap-6 border-b py-7 md:grid-cols-[1fr_auto] md:items-end">
          <div className="flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-[#8e5969] font-serif text-xl font-bold text-white shadow-sm">BC</div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h1 className="font-serif text-3xl font-semibold tracking-tight">@{displayUsername}</h1><span className="rounded-sm bg-accent px-2 py-1 text-[9px] font-extrabold tracking-wider text-accent-foreground uppercase">Đang bán</span></div>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Sưu tầm Riftbound từ Origins. Card được bảo quản sleeve và top loader.</p>
              <div className="mt-3 flex gap-5 text-[10px] text-muted-foreground"><span><b className="text-sm text-foreground">211</b> card</span><span><b className="text-sm text-foreground">28</b> card hiếm</span><span>Tham gia 08/2026</span></div>
            </div>
          </div>
          <Button variant="outline" size="sm">Liên hệ người bán <ExternalLink className="size-3.5" /></Button>
        </section>

        <section className="py-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><span className="text-[9px] font-extrabold tracking-[.18em] text-[#668334] uppercase">Bộ sưu tập công khai</span><h2 className="mt-1 font-serif text-2xl font-semibold text-[#5f793f]">Card đang có</h2></div>
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-9 bg-card pl-9 text-xs" placeholder="Tìm trong bộ sưu tập..." />
              </div>
              <Button variant="outline" size="sm"><Filter className="size-3.5" /> <span className="hidden sm:inline">Bộ lọc</span></Button>
              <Button variant="outline" size="icon" className="size-8"><SlidersHorizontal className="size-3.5" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((card) => (
              <Link href={`/u/${displayUsername}/cards/${card.id}`} key={card.id} className="group">
                <Card className="h-full overflow-hidden transition-all group-hover:-translate-y-1 group-hover:border-[#8ba55e] group-hover:shadow-lg">
                  <div className={cn("relative m-2.5 mb-0 grid aspect-[5/6] place-items-center overflow-hidden rounded-sm border-[3px] border-[#bca66e] bg-gradient-to-br shadow-inner", card.gradient)}>
                    <div className="absolute inset-2 rounded-[1px] border border-white/20" />
                    <span className="relative font-serif text-6xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,.65)]">{card.glyph}</span>
                    <span className="absolute bottom-3 text-[6px] font-bold tracking-[.24em] text-[#f4e4ae]">RIFTBOUND</span>
                    {card.finish === "Foil" && <span className="absolute top-2 right-2 rounded-sm bg-white/85 px-1.5 py-0.5 text-[7px] font-extrabold text-[#745e8d] uppercase">Foil</span>}
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between text-[8px] font-bold tracking-wider text-muted-foreground uppercase"><span>{card.set} · {card.number}</span><span className="text-[#8b6b31]">{card.rarity}</span></div>
                    <h3 className="mt-2 truncate font-serif text-sm font-semibold sm:text-base">{card.name}</h3>
                    <div className="mt-3 flex items-end justify-between border-t pt-2.5"><div><span className="block text-[8px] text-muted-foreground">Giá bán</span><strong className="font-serif text-base">{card.price}</strong></div><div className="text-right"><span className="block text-[8px] text-muted-foreground">{card.condition}</span><span className="text-[9px] font-bold">SL: {card.quantity}</span></div></div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
