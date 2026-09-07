"use client";

import {
  ChevronDown,
  Layers,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
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

export function Collection({
  cards,
  username,
  displayName,
  facebookUrl,
  isOwner = false,
}: {
  cards: CollectionCard[];
  username: string;
  displayName: string;
  facebookUrl?: string | null;
  isOwner?: boolean;
}) {
  const { addItem, items, updateQuantity } = useCart();
  const sellerKey = username.toLocaleLowerCase();
  const [query, setQuery] = useState("");
  const [set, setSet] = useState("");
  const [type, setType] = useState("");
  const [rarity, setRarity] = useState("");
  const [faction, setFaction] = useState("");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Theo tên");
  const [onlySelected, setOnlySelected] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<CollectionCard | null>(null);
  const ownedCards = cards;

  useEffect(() => {
    if (!previewCard) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewCard(null);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [previewCard]);

  const filterOptions = useMemo(
    () => ({
      sets: mergeValues(
        knownSets,
        ownedCards.map((card) => card.set),
      ),
      types: RIFTBOUND_CARD_TYPES,
      rarities: RIFTBOUND_RARITIES,
      domains: RIFTBOUND_DOMAINS,
    }),
    [ownedCards],
  );

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");

    const matches = ownedCards.filter((card) => {
      const matchesQuery =
        !normalizedQuery ||
        [card.name, card.set, card.number].some((value) =>
          value.toLocaleLowerCase("vi").includes(normalizedQuery),
        );
      const matchesSet = !set || card.set === set;
      const matchesType = !type || card.type === type;
      const matchesRarity = !rarity || card.rarity === rarity;
      const matchesFaction =
        !faction || card.domains?.includes(faction) || card.faction === faction;
      const matchesSelected =
        !onlySelected ||
        items.some((item) => item.key === `${sellerKey}:${card.id}`);
      return (
        matchesQuery &&
        matchesSet &&
        matchesType &&
        matchesRarity &&
        matchesFaction &&
        matchesSelected
      );
    });

    return matches.sort((a, b) => compareCards(a, b, sort));
  }, [
    faction,
    items,
    onlySelected,
    ownedCards,
    query,
    rarity,
    sellerKey,
    set,
    sort,
    type,
  ]);

  const hasFilters =
    query.length > 0 ||
    Boolean(set || type || rarity || faction || onlySelected);
  const clearFilters = () => {
    setQuery("");
    setSet("");
    setType("");
    setRarity("");
    setFaction("");
    setOnlySelected(false);
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-[#5f793f]">
            <Layers className="size-4" /> Card đang có
          </h2>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 bg-card pr-9 pl-9 text-xs"
            placeholder="Tìm card, set hoặc mã số..."
            aria-label="Tìm trong bộ sưu tập"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Xoá tìm kiếm"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="relative z-30 mb-5 overflow-visible border-y bg-card/60">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex h-11 w-full items-center justify-start gap-2 px-3 text-left text-xs font-bold text-[#506b32] sm:hidden"
          aria-expanded={filtersOpen}
          aria-controls="collection-card-filters"
        >
          <SlidersHorizontal className="size-3.5" />
          <span>Bộ lọc</span>
          {hasFilters && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-black text-accent-foreground">
              Đang áp dụng
            </span>
          )}
          <ChevronDown
            className={cn(
              "ml-auto size-3.5 transition-transform",
              filtersOpen && "rotate-180",
            )}
          />
        </button>
        <div
          id="collection-card-filters"
          className={cn(
            "flex-wrap items-center justify-start gap-2 px-3 py-3 text-left sm:flex",
            filtersOpen ? "flex border-t sm:border-t-0" : "hidden",
          )}
          aria-label="Bộ lọc card"
        >
          <FilterDropdown
            label="Set"
            value={set}
            options={filterOptions.sets}
            onChange={setSet}
            className="[&>summary]:min-w-48"
          />
          <FilterDropdown
            label="Loại card"
            value={type}
            options={filterOptions.types}
            onChange={setType}
          />
          <FilterDropdown
            label="Độ hiếm"
            value={rarity}
            options={filterOptions.rarities}
            onChange={setRarity}
          />
          <DomainFilter
            value={faction}
            options={filterOptions.domains}
            onChange={setFaction}
          />
          {!isOwner && (
            <label
              className={cn(
                "flex h-8 cursor-pointer items-center gap-2 rounded-sm border px-3 text-[10px] font-bold transition-colors",
                onlySelected &&
                  "border-[#8ba55e] bg-[#edf3e5] text-[#506b32]",
              )}
            >
              <input
                type="checkbox"
                checked={onlySelected}
                onChange={(event) => setOnlySelected(event.target.checked)}
                className="size-3 accent-[#607d35]"
              />{" "}
              Đã chọn
            </label>
          )}
          <FilterDropdown
            label="Sắp xếp"
            value={sort}
            options={sortOptions}
            onChange={(value) =>
              setSort(value as (typeof sortOptions)[number])
            }
            allowEmpty={false}
            className="[&>summary]:min-w-36"
          />
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {filteredCards.length}/{ownedCards.length} card
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex shrink-0 items-center gap-1 text-left text-[10px] font-bold text-[#607d35] hover:underline"
            >
              <X className="size-3" /> Xoá lọc
            </button>
          )}
        </div>
      </div>

      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {filteredCards.map((card) => {
            const cartItem = items.find(
              (item) => item.key === `${sellerKey}:${card.id}`,
            );
            const atLimit = (cartItem?.quantity ?? 0) >= card.quantity;
            const addCardToCart = () =>
              addItem({
                cardId: card.id,
                seller: sellerKey,
                sellerDisplayName: displayName,
                sellerFacebookUrl: facebookUrl ?? undefined,
                name: card.name,
                set: card.set,
                number: card.number,
                finish: card.finish,
                condition: card.condition,
                price: card.price,
                imageUrl: card.imageUrl,
                glyph: card.glyph,
                gradient: card.gradient,
                stock: card.quantity,
              });
            return (
              <Card
                key={card.id}
                role="button"
                tabIndex={0}
                aria-label={`Xem ảnh ${card.name}`}
                onClick={() => card.imageUrl && setPreviewCard(card)}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ") &&
                    card.imageUrl
                  ) {
                    event.preventDefault();
                    setPreviewCard(card);
                  }
                }}
                className="group relative flex h-full cursor-default flex-col overflow-visible transition-all hover:-translate-y-1 hover:border-[#8ba55e] hover:shadow-lg"
              >
                {cartItem && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateQuantity(cartItem.key, 0);
                    }}
                    className="absolute top-0 right-0 z-30 hidden min-w-8 translate-x-1/2 -translate-y-1/2 place-items-center rounded-sm border-2 border-card bg-accent px-2 py-1 text-[11px] font-black text-accent-foreground shadow-md sm:grid"
                    aria-label={`Xoá ${card.name} khỏi giỏ`}
                    title="Xoá khỏi giỏ"
                  >
                    <span className="group-hover:hidden">
                      ×{cartItem.quantity}
                    </span>
                    <Trash2 className="hidden size-3.5 group-hover:block" />
                  </button>
                )}
                <div
                  className={cn(
                    "relative m-2.5 mb-0 grid aspect-[469/655] place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br",
                    card.gradient,
                  )}
                >
                  {card.imageUrl && (
                    <img
                      src={card.imageUrl}
                      alt={`Artwork của ${card.name}`}
                      className="absolute inset-0 size-full object-cover"
                    />
                  )}
                  {!isOwner && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-[30%] z-20 hidden justify-center px-2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100 sm:flex">
                      {cartItem ? (
                        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/70 bg-card/95 p-1 shadow-xl backdrop-blur-md">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              updateQuantity(
                                cartItem.key,
                                cartItem.quantity - 1,
                              );
                            }}
                            className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="size-3" />
                          </button>
                          <button
                            type="button"
                            disabled={atLimit}
                            onClick={(event) => {
                              event.stopPropagation();
                              updateQuantity(
                                cartItem.key,
                                cartItem.quantity + 1,
                              );
                            }}
                            className="min-w-8 rounded-full px-1 text-center text-[10px] font-black hover:bg-secondary disabled:cursor-default disabled:opacity-60"
                            aria-label={`Tăng số lượng ${card.name}`}
                          >
                            {cartItem.quantity}/{card.quantity}
                          </button>
                          <button
                            type="button"
                            disabled={atLimit}
                            onClick={(event) => {
                              event.stopPropagation();
                              updateQuantity(
                                cartItem.key,
                                cartItem.quantity + 1,
                              );
                            }}
                            className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="accent"
                          size="icon"
                          className="pointer-events-auto size-10 cursor-pointer rounded-full border border-white/70 shadow-xl transition-transform hover:scale-105"
                          aria-label={`Thêm ${card.name} vào giỏ`}
                          title="Thêm vào giỏ"
                          onClick={(event) => {
                            event.stopPropagation();
                            addCardToCart();
                          }}
                        >
                          <ShoppingBag className="size-4" strokeWidth={2.25} />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="block">
                  <CardContent className="p-3 pb-2">
                    <div className="mt-1 flex min-w-0 items-center gap-1.5">
                      <span className="shrink-0 rounded-sm border bg-secondary px-1.5 py-0.5 text-[8px] font-black tracking-wider text-muted-foreground">
                        {setCode(card.set)}
                      </span>
                      <div className="card-title min-w-0 flex-1 overflow-hidden">
                        <h3 className="card-title-text w-max min-w-full font-serif text-sm font-semibold sm:text-base">
                          {card.name}
                        </h3>
                      </div>
                    </div>
                    <span className={cn(
                      "mt-2 inline-block rounded-sm border px-1.5 py-0.5 text-[10px] font-bold",
                      card.finish === "Foil" ? "border-primary/30 bg-accent/40 text-primary" : "text-muted-foreground",
                    )}>
                      {card.finish === "Foil" ? "Foil" : "Không foil"}
                    </span>
                    <div className="mt-2 flex items-center justify-between border-t pt-1.5">
                      <strong className="font-serif text-base">
                        {card.price}
                      </strong>
                      <span className="grid min-w-6 place-items-center rounded-sm border bg-secondary px-1.5 py-0.5 text-[9px] font-black">
                        ×{card.quantity}
                      </span>
                    </div>
                    {!isOwner && (
                      <div className="mt-2 border-t pt-2 sm:hidden">
                        {cartItem ? (
                          <div
                            className="flex h-9 items-center overflow-hidden rounded-md border bg-background"
                            aria-label={`${card.name}: đã chọn ${cartItem.quantity} trên ${card.quantity}`}
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateQuantity(
                                  cartItem.key,
                                  cartItem.quantity - 1,
                                );
                              }}
                              className="grid h-full flex-1 place-items-center text-muted-foreground active:bg-secondary active:text-foreground"
                              aria-label={`Giảm số lượng ${card.name}`}
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="grid h-full min-w-12 place-items-center border-x bg-card px-1 text-[10px] font-black">
                              {cartItem.quantity}/{card.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={atLimit}
                              onClick={(event) => {
                                event.stopPropagation();
                                updateQuantity(
                                  cartItem.key,
                                  cartItem.quantity + 1,
                                );
                              }}
                              className="grid h-full flex-1 place-items-center text-primary active:bg-secondary disabled:opacity-30"
                              aria-label={`Tăng số lượng ${card.name}`}
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="accent"
                            size="sm"
                            className="h-9 w-full px-2 text-[10px]"
                            onClick={(event) => {
                              event.stopPropagation();
                              addCardToCart();
                            }}
                            aria-label={`Thêm ${card.name} vào giỏ`}
                          >
                            <ShoppingBag className="size-3.5" strokeWidth={2.25} />
                            Thêm vào giỏ
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid min-h-48 place-items-center rounded-lg border border-dashed bg-card/50 px-6 text-center">
          <div>
            <p className="font-serif text-lg font-semibold">
              Không tìm thấy card phù hợp
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-xs font-bold text-[#607d35] underline underline-offset-4"
            >
              Xoá toàn bộ bộ lọc
            </button>
          </div>
        </div>
      )}

      {previewCard?.imageUrl && (
        <div
          className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Ảnh ${previewCard.name}`}
          onMouseDown={(event) =>
            event.target === event.currentTarget && setPreviewCard(null)
          }
        >
          <img
            src={previewCard.imageUrl}
            alt={previewCard.name}
            className="max-h-[80vh] max-w-full cursor-default rounded-lg object-contain shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setPreviewCard(null)}
            className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/75"
            aria-label="Đóng ảnh"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </>
  );
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function mergeValues(requiredValues: string[], actualValues: string[]) {
  return [...new Set([...requiredValues, ...actualValues.filter(Boolean)])];
}

function setCode(set: string) {
  const knownCodes: Record<string, string> = {
    Origins: "OGN",
    Spiritforged: "SFD",
    Unleashed: "UNL",
    Vendetta: "VEN",
  };
  return (
    knownCodes[set] ??
    set
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 3)
      .toUpperCase()
  );
}

function compareCards(
  a: CollectionCard,
  b: CollectionCard,
  sort: (typeof sortOptions)[number],
) {
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
