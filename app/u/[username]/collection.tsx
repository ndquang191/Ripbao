"use client";

import Link from "next/link";
import { Layers, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";

type Finish = "Foil" | "No Foil";

export type CollectionCard = {
  id: string;
  name: string;
  set: string;
  number: string;
  rarity: string;
  type: string;
  faction: string;
  finish: Finish;
  condition: string;
  price: string;
  quantity: number;
  glyph: string;
  gradient: string;
  imageUrl?: string;
};

const finishFilters: Finish[] = ["Foil", "No Foil"];
const knownSets = ["Origins", "Spiritforged", "Unleashed", "Vendetta"];
const knownCardTypes = ["Gear", "Spell", "Unit", "Battlefield", "Champion", "Legend"];

export function Collection({ cards, username }: { cards: CollectionCard[]; username: string }) {
  const { addItem, items, updateQuantity } = useCart();
  const [query, setQuery] = useState("");
  const [set, setSet] = useState("");
  const [type, setType] = useState("");
  const [rarity, setRarity] = useState("");
  const [faction, setFaction] = useState("");
  const [finish, setFinish] = useState("");

  const filterOptions = useMemo(() => ({
    sets: mergeValues(knownSets, cards.map((card) => card.set)),
    types: mergeValues(knownCardTypes, cards.map((card) => card.type)),
    rarities: uniqueValues(cards.map((card) => card.rarity)),
    factions: uniqueValues(cards.map((card) => card.faction)),
  }), [cards]);

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");

    return cards.filter((card) => {
      const matchesQuery = !normalizedQuery || [card.name, card.set, card.number]
        .some((value) => value.toLocaleLowerCase("vi").includes(normalizedQuery));
      const matchesSet = !set || card.set === set;
      const matchesType = !type || card.type === type;
      const matchesRarity = !rarity || card.rarity === rarity;
      const matchesFaction = !faction || card.faction === faction;
      const matchesFinish = !finish || card.finish === finish;
      return matchesQuery && matchesSet && matchesType && matchesRarity && matchesFaction && matchesFinish;
    });
  }, [cards, faction, finish, query, rarity, set, type]);

  const hasFilters = query.length > 0 || Boolean(set || type || rarity || faction || finish);
  const clearFilters = () => { setQuery(""); setSet(""); setType(""); setRarity(""); setFaction(""); setFinish(""); };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-[#5f793f]"><Layers className="size-4" /> Card đang có</h2>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 bg-card pr-9 pl-9 text-xs" placeholder="Tìm card, set hoặc mã số..." aria-label="Tìm trong bộ sưu tập" />
          {query && <button type="button" onClick={() => setQuery("")} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Xoá tìm kiếm"><X className="size-3.5" /></button>}
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2 overflow-x-auto border-y bg-card/60 px-3 py-3 whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Bộ lọc card">
        <SelectFilter label="Set" value={set} options={filterOptions.sets} onChange={setSet} />
        <SelectFilter label="Loại card" value={type} options={filterOptions.types} onChange={setType} />
        <SelectFilter label="Độ hiếm" value={rarity} options={filterOptions.rarities} onChange={setRarity} />
        <SelectFilter label="Faction" value={faction} options={filterOptions.factions} onChange={setFaction} />
        <SelectFilter label="Bề mặt" value={finish} options={finishFilters} onChange={setFinish} />
        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{filteredCards.length}/{cards.length} card</span>
        {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#607d35] hover:underline"><X className="size-3" /> Xoá lọc</button>}
      </div>

      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredCards.map((card) => {
            const cartItem = items.find((item) => item.key === `${username}:${card.id}`);
            const atLimit = (cartItem?.quantity ?? 0) >= card.quantity;
            return (
            <Card key={card.id} className="group relative flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:border-[#8ba55e] hover:shadow-lg">
              {cartItem && <span className="absolute top-1.5 right-1.5 z-30 grid size-7 place-items-center rounded-full border-2 border-card bg-accent text-[10px] font-black text-accent-foreground shadow-md" aria-label={`Đã chọn ${cartItem.quantity} card`}>{cartItem.quantity}</span>}
              <div className={cn("relative m-2.5 mb-0 grid aspect-[5/6] place-items-center overflow-hidden rounded-sm border-[3px] border-[#bca66e] bg-gradient-to-br shadow-inner", card.gradient)}>
                  <Link href={`/u/${encodeURIComponent(username)}/cards/${card.id}`} className="absolute inset-0 z-10" aria-label={`Xem ${card.name}`} />
                  {card.imageUrl && <img src={card.imageUrl} alt={`Artwork của ${card.name}`} className="absolute inset-0 size-full object-cover" />}
                  <div className="absolute inset-2 rounded-[1px] border border-white/20" />
                  <span className="absolute top-2 left-2 rounded-sm bg-black/45 px-1.5 py-0.5 text-[7px] font-extrabold text-white uppercase">{card.type}</span>
                  <span className="relative font-serif text-6xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,.65)]">{card.glyph}</span>
                  <span className="absolute bottom-3 text-[6px] font-bold tracking-[.24em] text-[#f4e4ae]">RIFTBOUND</span>
                  {card.finish === "Foil" && <span className="absolute top-2 right-2 rounded-sm bg-white/85 px-1.5 py-0.5 text-[7px] font-extrabold text-[#745e8d] uppercase">Foil</span>}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/65 via-black/20 to-transparent px-3 pt-12 pb-3 opacity-100 transition-all duration-200 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
                    {cartItem ? (
                      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/70 bg-card/95 p-1 shadow-xl backdrop-blur-md">
                        <button type="button" onClick={() => updateQuantity(cartItem.key, cartItem.quantity - 1)} className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Giảm số lượng"><Minus className="size-3" /></button>
                        <div className="flex h-7 items-center rounded-full bg-secondary/80 px-1">
                          <input type="number" min="0" max={card.quantity} value={cartItem.quantity} onFocus={(event) => event.currentTarget.select()} onChange={(event) => { const value = event.currentTarget.valueAsNumber; if (Number.isFinite(value)) updateQuantity(cartItem.key, value); }} className="w-7 bg-transparent text-center text-[11px] font-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" aria-label={`Số lượng ${card.name}`} />
                          <span className="pr-1 text-[8px] font-bold text-muted-foreground">/{card.quantity}</span>
                        </div>
                        <button type="button" disabled={atLimit} onClick={() => updateQuantity(cartItem.key, cartItem.quantity + 1)} className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30" aria-label="Tăng số lượng"><Plus className="size-3" /></button>
                        <button type="button" onClick={() => updateQuantity(cartItem.key, card.quantity)} disabled={atLimit} className="mr-0.5 h-7 rounded-full bg-primary px-2 text-[8px] font-black tracking-wide text-primary-foreground uppercase transition-colors hover:bg-primary/85 disabled:bg-secondary disabled:text-muted-foreground">Max</button>
                      </div>
                    ) : (
                      <Button type="button" variant="accent" size="icon" className="pointer-events-auto size-10 rounded-full border border-white/70 shadow-xl transition-transform hover:scale-105" aria-label={`Thêm ${card.name} vào giỏ`} title="Thêm vào giỏ" onClick={() => addItem({ cardId: card.id, seller: username, name: card.name, set: card.set, number: card.number, finish: card.finish, condition: card.condition, price: card.price, imageUrl: card.imageUrl, glyph: card.glyph, gradient: card.gradient, stock: card.quantity })}>
                        <ShoppingBag className="size-4" strokeWidth={2.25} />
                      </Button>
                    )}
                  </div>
                </div>
              <Link href={`/u/${encodeURIComponent(username)}/cards/${card.id}`} className="block">
                <CardContent className="p-3 pb-2">
                  <div className="flex items-center justify-between text-[8px] font-bold tracking-wider text-muted-foreground uppercase"><span>{card.set} · {card.number}</span><span className="text-[#8b6b31]">{card.rarity}</span></div>
                  <h3 className="mt-2 truncate font-serif text-sm font-semibold sm:text-base">{card.name}</h3>
                  <div className="mt-3 flex items-end justify-between border-t pt-2.5"><div><span className="block text-[8px] text-muted-foreground">Giá bán</span><strong className="font-serif text-base">{card.price}</strong></div><div className="text-right"><span className="block text-[8px] text-muted-foreground">{card.condition}</span><span className="text-[9px] font-bold">SL: {card.quantity}</span></div></div>
                </CardContent>
              </Link>
            </Card>
          )})}
        </div>
      ) : (
        <div className="grid min-h-48 place-items-center rounded-lg border border-dashed bg-card/50 px-6 text-center">
          <div><p className="font-serif text-lg font-semibold">Không tìm thấy card phù hợp</p><button type="button" onClick={clearFilters} className="mt-2 text-xs font-bold text-[#607d35] underline underline-offset-4">Xoá toàn bộ bộ lọc</button></div>
        </div>
      )}
    </>
  );
}

function SelectFilter({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (value: string) => void }) {
  if (options.length === 0) return null;

  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={`Lọc theo ${label}`} className="h-8 min-w-28 shrink-0 rounded-sm border bg-card px-2 text-[10px] font-bold focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none">
      <option value="">Tất cả {label.toLocaleLowerCase("vi")}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function mergeValues(requiredValues: string[], actualValues: string[]) {
  return [...new Set([...requiredValues, ...actualValues.filter(Boolean)])];
}
