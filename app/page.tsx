import Link from "next/link";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AccountLink } from "@/components/account-link";
import { CartLink } from "@/components/cart-link";

const sellers = [
  { username: "bao.collects", initials: "BC", cards: 211, rare: 28, color: "bg-[#8e5969]", featured: true },
  { username: "minhcards", initials: "MC", cards: 126, rare: 17, color: "bg-[#a47b36]" },
  { username: "the_rift", initials: "TR", cards: 84, rare: 12, color: "bg-[#416478]" },
  { username: "littleporo", initials: "LP", cards: 63, rare: 9, color: "bg-[#65754e]" },
];

function CardArtwork() {
  return (
    <div className="relative mx-auto h-[430px] w-full max-w-[470px]" aria-label="Minh hoạ thẻ bài Riftbound">
      <div className="absolute top-1/2 left-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border shadow-[0_0_0_44px_rgba(238,236,227,.6),0_0_0_88px_rgba(238,236,227,.35)]" />
      <div className="absolute top-10 right-4 size-64 rounded-full bg-[#dcedad]/75 blur-sm" />
      <div className="absolute bottom-4 left-5 size-44 rounded-full bg-[#cfdee4]/60 blur-sm" />
      <div className="absolute top-10 left-1/2 h-[322px] w-[222px] -translate-x-[22%] rotate-[12deg] rounded-lg border-4 border-[#76966e] bg-primary shadow-2xl">
        <span className="grid h-full place-items-center font-serif text-8xl text-accent/35">R</span>
      </div>
      <div className="absolute top-8 left-1/2 h-[330px] w-[230px] -translate-x-[70%] -rotate-[7deg] rounded-lg border-[3px] border-[#b49d63] bg-[#e9dfbd] p-2 shadow-2xl">
        <span className="absolute top-3 left-3 z-10 grid size-8 place-items-center rounded-full bg-primary text-sm font-black text-white">3</span>
        <div className="relative grid h-[190px] place-items-center overflow-hidden bg-[radial-gradient(circle_at_55%_34%,#f0c7ee_0_8%,#9255a5_28%,#35477a_62%,#202845_100%)]">
          <Sparkles className="size-20 text-white drop-shadow-[0_0_18px_#ff9be7]" strokeWidth={1} />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#35254f]/70 via-[#633f7b]/25 to-transparent" />
          <div className="absolute -right-8 -bottom-14 size-32 rounded-full border border-white/15 bg-[#be73bd]/20 blur-sm" />
        </div>
        <div className="px-2 pt-2.5 pb-4 text-[#28362d]">
          <span className="text-[6px] font-bold tracking-[.16em]">CHAMPION · EPIC</span><strong className="mt-0.5 block font-serif text-lg">Jinx, Rebel</strong>
          <p className="mt-0.5 h-7 text-[7px]">When you conquer a battlefield, draw a card.</p>
          <div className="mt-2 border-t border-[#a69e7f] pt-2.5 text-center text-[7px] tracking-wider"><span>ORIGINS · 181/221</span></div>
        </div>
      </div>
      <Card className="absolute right-0 bottom-12 z-20 min-w-40 border-l-[3px] border-l-accent shadow-xl">
        <CardContent className="relative p-3.5"><span className="block text-[8px] font-bold tracking-wider text-muted-foreground uppercase">Market price</span><strong className="mt-0.5 block font-serif text-2xl">$42.80</strong><b className="absolute right-3 bottom-4 text-[9px] text-[#65982e]">↗ 12.4%</b></CardContent>
      </Card>
      <span className="absolute top-16 right-0 text-3xl text-[#90a967]">✦</span><span className="absolute bottom-8 left-14 text-xl text-[#90a967]">✧</span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="paper-grid min-h-dvh overflow-x-hidden lg:h-dvh lg:overflow-hidden">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:h-dvh lg:min-h-0 lg:py-7">
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_minmax(320px,520px)_1fr]">
          <Link href="/" className="flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]">
            <span className="relative block h-9 w-8 rounded-sm border-2 border-accent bg-primary shadow-sm">
              <span className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 font-serif text-lg leading-none text-accent">R</span>
            </span>
            RIPBAO
          </Link>
          <div className="relative order-3 sm:order-none">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-11 bg-card/95 pr-23 pl-10 shadow-sm" placeholder="Tìm card, set hoặc người bán..." aria-label="Tìm kiếm" />
            <Button size="sm" className="absolute top-1.5 right-1.5 h-8">Tìm</Button>
          </div>
          <div className="flex justify-self-end gap-2"><CartLink /><AccountLink /></div>
        </div>

        <section className="grid flex-1 items-center gap-8 py-5 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:py-2">
          <div>
            <div className="mb-4 flex items-end justify-between">
              <div><h1 className="font-serif text-2xl font-semibold leading-none tracking-[-0.02em] text-[#5f793f]">Khám phá bộ sưu tập</h1></div>
              <Link href="/sellers" className="hidden items-center gap-1 text-xs font-bold underline-offset-4 hover:underline sm:flex">Xem tất cả <ArrowUpRight className="size-3.5" /></Link>
            </div>
            <div className="grid gap-2.5">
              {sellers.map((seller) => (
                <Link href={`/u/${seller.username}`} key={seller.username} className="group">
                  <Card className={cn("transition-all group-hover:translate-x-1 group-hover:border-[#8ba55e] group-hover:shadow-md", seller.featured && "border-primary bg-primary text-primary-foreground")}>
                    <CardContent className="flex items-center gap-4 p-3.5">
                      <div className={cn("grid size-11 shrink-0 place-items-center rounded-full font-serif text-sm font-bold text-white", seller.color)}>{seller.initials}</div>
                      <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-extrabold">@{seller.username}</h2><p className={cn("mt-1 text-[10px] text-muted-foreground", seller.featured && "text-white/60")}>{seller.cards} card · {seller.rare} card hiếm</p></div>
                      <ArrowUpRight className={cn("size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", seller.featured && "text-accent")} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <Card className="mt-2.5 border-dashed bg-secondary/75"><CardContent className="flex items-center justify-between gap-5 p-3.5"><div><strong className="text-sm">Bạn cũng có một bộ sưu tập?</strong><p className="mt-0.5 text-[10px] text-muted-foreground">Tạo trang riêng và chia sẻ card của bạn.</p></div><Link href="/register" className={cn(buttonVariants({ variant: "accent", size: "sm" }), "shrink-0")}>Tạo miễn phí <ArrowUpRight className="size-3.5" /></Link></CardContent></Card>
          </div>
          <div className="hidden lg:block"><CardArtwork /></div>
        </section>

        <div className="flex items-center justify-between border-t pt-3 text-[9px] text-muted-foreground"><span>© 2026 Ripbao</span><span>Không liên kết với Riot Games · Giá chỉ mang tính tham khảo</span></div>
      </div>
    </main>
  );
}
