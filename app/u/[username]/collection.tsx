"use client";

import Link from "next/link";
import { Layers, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { DomainFilter, FilterDropdown } from "@/components/domain-filter";
import { parseCurrency } from "@/lib/currency";
import {
  RIFTBOUND_CARD_TYPES,
  RIFTBOUND_DOMAINS,
  RIFTBOUND_RARITIES,
} from "@/lib/riftbound-constants";

type Finish = "Foil" | "No Foil";

export type CollectionCard = {
  id: string;
  name: string;
  set: string;
  number: string;
  rarity: string;
  type: string;
  faction: string;
  domains?: string[];
  supertype?: string | null;
  isNew?: boolean;
  finish: Finish;
  condition: string;
  price: string;
  quantity: number;
  glyph: string;
  gradient: string;
  imageUrl?: string;
};

const knownSets = ["Origins", "Spiritforged", "Unleashed", "Vendetta"];
const sortOptions = ["Theo tên", "Giá tăng dần", "Giá giảm dần"] as const;
const collectionDraftKey = "ripbao.collection.draft.v2";

export function Collection({ cards, username }: { cards: CollectionCard[]; username: string }) {
  const { addItem, items, updateQuantity } = useCart();
  const [query, setQuery] = useState("");
  const [set, setSet] = useState("");
  const [type, setType] = useState("");
  const [rarity, setRarity] = useState("");
  const [faction, setFaction] = useState("");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Theo tên");
  const [ownedQuantities, setOwnedQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const draft = window.localStorage.getItem(collectionDraftKey);
      if (!draft) return;
      const edits = JSON.parse(draft) as Record<string, { quantity?: number }>;
      setOwnedQuantities(Object.fromEntries(
        Object.entries(edits)
          .filter(([, edit]) => (edit.quantity ?? 0) > 0)
          .map(([id, edit]) => [id, edit.quantity ?? 0]),
      ));
    } catch {
      setOwnedQuantities({});
    }
  }, []);

  const ownedCards = useMemo(() => cards
    .filter((card) => (ownedQuantities[card.id] ?? 0) > 0)
    .map((card) => ({ ...card, quantity: ownedQuantities[card.id] })), [cards, ownedQuantities]);

  const filterOptions = useMemo(() => ({
    sets: mergeValues(knownSets, ownedCards.map((card) => card.set)),
    types: RIFTBOUND_CARD_TYPES,
    rarities: RIFTBOUND_RARITIES,
    domains: RIFTBOUND_DOMAINS,
  }), [ownedCards]);

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");

    const matches = ownedCards.filter((card) => {
      const matchesQuery = !normalizedQuery || [card.name, card.set, card.number]
        .some((value) => value.toLocaleLowerCase("vi").includes(normalizedQuery));
      const matchesSet = !set || card.set === set;
      const matchesType = !type || card.type === type;
      const matchesRarity = !rarity || card.rarity === rarity;
      const matchesFaction = !faction || card.domains?.includes(faction) || card.faction === faction;
      return matchesQuery && matchesSet && matchesType && matchesRarity && matchesFaction;
    });

    return matches.sort((a, b) => compareCards(a, b, sort));
  }, [faction, ownedCards, query, rarity, set, sort, type]);

  const hasFilters = query.length > 0 || Boolean(set || type || rarity || faction);
  const clearFilters = () => { setQuery(""); setSet(""); setType(""); setRarity(""); setFaction(""); };

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

      <div className="relative z-30 mb-5 flex flex-wrap items-center gap-2 overflow-visible border-y bg-card/60 px-3 py-3" aria-label="Bộ lọc card">
        <FilterDropdown label="Set" value={set} options={filterOptions.sets} onChange={setSet} className="[&>summary]:min-w-48" />
        <FilterDropdown label="Loại card" value={type} options={filterOptions.types} onChange={setType} />
        <FilterDropdown label="Độ hiếm" value={rarity} options={filterOptions.rarities} onChange={setRarity} />
        <DomainFilter value={faction} options={filterOptions.domains} onChange={setFaction} />
        <FilterDropdown label="Sắp xếp" value={sort} options={sortOptions} onChange={(value) => setSort(value as (typeof sortOptions)[number])} allowEmpty={false} className="ml-auto [&>summary]:min-w-36" />
        <span className="shrink-0 text-[10px] text-muted-foreground">{filteredCards.length}/{ownedCards.length} card</span>
        {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#607d35] hover:underline"><X className="size-3" /> Xoá lọc</button>}
      </div>

      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filteredCards.map((card) => {
            const cartItem = items.find((item) => item.key === `${username}:${card.id}`);
            const atLimit = (cartItem?.quantity ?? 0) >= card.quantity;
            return (
            <Card key={card.id} className="group relative flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:border-[#8ba55e] hover:shadow-lg">
              <div className={cn(
                "relative m-2.5 mb-0 grid aspect-[469/655] place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br",
                card.gradient,
              )}>
                  <button
                    type="button"
                    disabled={atLimit}
                    onClick={() => cartItem
                      ? updateQuantity(cartItem.key, cartItem.quantity + 1)
                      : addItem({ cardId: card.id, seller: username, name: card.name, set: card.set, number: card.number, finish: card.finish, condition: card.condition, price: card.price, imageUrl: card.imageUrl, glyph: card.glyph, gradient: card.gradient, stock: card.quantity })}
                    className="absolute inset-0 z-10 cursor-pointer disabled:cursor-default"
                    aria-label={atLimit ? `${card.name} đã đạt số lượng tối đa` : `Đặt ${card.name}`}
                    title={atLimit ? "Đã đạt số lượng tối đa" : "Thêm vào giỏ"}
                  />
                  {card.imageUrl && <img src={card.imageUrl} alt={`Artwork của ${card.name}`} className="absolute inset-0 size-full object-cover" />}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/65 via-black/20 to-transparent px-2 pt-10 pb-2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                    {cartItem ? (
                      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/70 bg-card/95 p-1 shadow-xl backdrop-blur-md">
                        <button type="button" onClick={() => updateQuantity(cartItem.key, cartItem.quantity - 1)} className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Giảm số lượng"><Minus className="size-3" /></button>
                        <span className="min-w-8 text-center text-[10px] font-black">{cartItem.quantity}/{card.quantity}</span>
                        <button type="button" disabled={atLimit} onClick={() => updateQuantity(cartItem.key, cartItem.quantity + 1)} className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30" aria-label="Tăng số lượng"><Plus className="size-3" /></button>
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

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function mergeValues(requiredValues: string[], actualValues: string[]) {
  return [...new Set([...requiredValues, ...actualValues.filter(Boolean)])];
}

function compareCards(a: CollectionCard, b: CollectionCard, sort: (typeof sortOptions)[number]) {
  const byName = a.name.localeCompare(b.name, "vi");
  if (sort === "Theo tên") return byName;

  const aPrice = parseCurrency(a.price);
  const bPrice = parseCurrency(b.price);
  if (aPrice === null && bPrice === null) return byName;
  if (aPrice === null) return 1;
  if (bPrice === null) return -1;

  const byPrice = aPrice - bPrice;
  return (sort === "Giá tăng dần" ? byPrice : -byPrice) || byName;
}
