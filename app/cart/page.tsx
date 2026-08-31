"use client";

import Link from "next/link";
import { ArrowLeft, Check, Copy, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { AccountLink } from "@/components/account-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrency } from "@/lib/currency";

export default function CartPage() {
  const { items, count, updateQuantity, removeItem, clear } = useCart();
  const [copiedSeller, setCopiedSeller] = useState<string | null>(null);
  const groups = Object.entries(items.reduce<Record<string, typeof items>>((result, item) => {
    (result[item.seller] ??= []).push(item);
    return result;
  }, {}));

  return (
    <main className="paper-grid min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 lg:py-7">
        <header className="flex items-center justify-between border-b pb-5">
          <Link href="/" className="flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]"><span className="grid h-9 w-8 place-items-center rounded-sm border-2 border-accent bg-primary font-serif text-lg text-accent">R</span> RIPBAO</Link>
          <AccountLink />
        </header>

        <div className="flex items-end justify-between gap-4 py-7">
          <div><Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Tiếp tục xem collection</Link><h1 className="flex items-center gap-2 font-serif text-3xl font-semibold"><ShoppingBag className="size-6 text-[#5f793f]" /> Giỏ hàng</h1><p className="mt-1 text-xs text-muted-foreground">{count} card từ {groups.length} collection</p></div>
          {items.length > 0 && <Button variant="ghost" size="sm" onClick={clear} className="text-destructive"><Trash2 className="size-3.5" /> Xoá giỏ hàng</Button>}
        </div>

        {items.length === 0 ? (
          <Card className="grid min-h-72 place-items-center border-dashed bg-card/70 p-8 text-center"><div><ShoppingBag className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-4 font-serif text-xl font-semibold">Giỏ hàng đang trống</h2><p className="mt-1 text-xs text-muted-foreground">Khám phá các collection và chọn card bạn thích.</p><Link href="/" className={cn(buttonVariants({ size: "sm" }), "mt-5")}>Khám phá collection</Link></div></Card>
        ) : (
          <div className="space-y-5">
            {groups.map(([seller, sellerItems]) => {
              const pricedItems = sellerItems.map((item) => ({ item, unitPrice: parseCurrency(item.price) }));
              const sellerTotal = pricedItems.reduce((total, { item, unitPrice }) => total + (unitPrice ?? 0) * item.quantity, 0);
              const sellerCount = sellerItems.reduce((total, item) => total + item.quantity, 0);
              const needsQuote = pricedItems.some(({ unitPrice }) => unitPrice === null);
              const copyCards = async () => {
                const lines = sellerItems.map((item) => {
                  const unitPrice = parseCurrency(item.price);
                  const subtotal = unitPrice === null ? "Liên hệ" : formatCurrency(unitPrice * item.quantity);
                  return `${item.quantity}x ${item.name} — ${item.set} ${item.number} — ${subtotal}`;
                });
                lines.push(`Tổng: ${formatCurrency(sellerTotal)}${needsQuote ? " + card cần báo giá" : ""}`);
                await navigator.clipboard.writeText(`@${seller}\n${lines.join("\n")}`);
                setCopiedSeller(seller);
                window.setTimeout(() => setCopiedSeller((current) => current === seller ? null : current), 1600);
              };

              return <section key={seller}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5"><Link href={`/u/${encodeURIComponent(seller)}`} className="font-bold hover:text-[#5f793f] hover:underline">@{seller}</Link><a href={`https://m.me/${encodeURIComponent(seller)}`} target="_blank" rel="noreferrer" className="grid size-6 place-items-center rounded-sm border bg-card text-[10px] font-black text-primary transition-colors hover:bg-secondary" aria-label={`Nhắn tin cho @${seller} qua Facebook`} title="Nhắn tin qua Facebook">f</a></div>
                <div className="flex items-center gap-2"><span className="text-[10px] text-muted-foreground">{sellerCount} card · Tổng: <strong className="text-foreground">{formatCurrency(sellerTotal)}</strong>{needsQuote && " + báo giá"}</span><Button variant="outline" size="sm" className="h-7 px-2 text-[9px]" onClick={copyCards}>{copiedSeller === seller ? <Check className="size-3" /> : <Copy className="size-3" />}{copiedSeller === seller ? "Đã copy" : "Copy"}</Button></div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
                {sellerItems.map((item) => {
                  const unitPrice = parseCurrency(item.price);
                  return <Card key={item.key} className="relative min-w-0 overflow-hidden p-2.5">
                  <Button variant="ghost" size="icon" className="absolute top-1 right-1 z-10 size-7 rounded-full bg-card/85 text-muted-foreground shadow-sm backdrop-blur hover:text-destructive" onClick={() => removeItem(item.key)} aria-label={`Xoá ${item.name}`}><Trash2 className="size-3.5" /></Button>
                  <div className="flex min-w-0 gap-2.5">
                    <div className={cn("relative grid h-20 aspect-[469/655] shrink-0 place-items-center overflow-hidden rounded-[5px] border-2 border-[#bca66e] bg-gradient-to-br", item.gradient)}>{item.imageUrl && <img src={item.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />}</div>
                    <div className="min-w-0 pt-0.5"><p className="truncate pr-5 text-[8px] font-bold tracking-wide text-muted-foreground uppercase">{item.set} · {item.number}</p><h2 className="mt-1 line-clamp-2 text-xs leading-4 font-bold">{item.name}</h2><p className="mt-1 truncate text-[9px] text-muted-foreground">{item.finish} · {item.condition}</p><span className="mt-1 block text-[8px] text-muted-foreground">{unitPrice === null ? item.price : formatCurrency(unitPrice)} × {item.quantity}</span><strong className="block text-xs">{unitPrice === null ? "Liên hệ" : formatCurrency(unitPrice * item.quantity)}</strong></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t pt-1.5">
                    <span className="text-[8px] text-muted-foreground">Tối đa {item.stock}</span>
                    <div className="flex items-center rounded-sm border bg-background p-px"><button type="button" className="grid size-4.5 place-items-center rounded-sm hover:bg-secondary disabled:opacity-30" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.key, item.quantity - 1)} aria-label="Giảm số lượng"><Minus className="size-2.5" /></button><span className="w-4.5 text-center text-[8px] font-black">{item.quantity}</span><button type="button" className="grid size-4.5 place-items-center rounded-sm hover:bg-secondary disabled:opacity-30" disabled={item.quantity >= item.stock} onClick={() => updateQuantity(item.key, item.quantity + 1)} aria-label="Tăng số lượng"><Plus className="size-2.5" /></button></div>
                  </div>
                </Card>})}
              </div>
            </section>})}
            <div className="flex justify-end border-t pt-5"><Button>Gửi yêu cầu mua · {count} card</Button></div>
          </div>
        )}
      </div>
    </main>
  );
}
