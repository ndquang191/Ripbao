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
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cartItemKey, useCart } from "@/components/cart-provider";
import { DomainFilter, FilterDropdown } from "@/components/domain-filter";
import { useModalDialog } from "@/app/collection/_hooks/use-modal-dialog";
import { parseCurrency } from "@/lib/currency";
import {
  RIFTBOUND_CARD_TYPES,
  RIFTBOUND_DOMAINS,
  RIFTBOUND_RARITIES,
  RIFTBOUND_SET_CODES,
  RIFTBOUND_SET_NAMES,
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

type GroupedCollectionCard = CollectionCard & {
  variants: CollectionCard[];
};

const sortOptions = ["Theo tên", "Giá tăng dần", "Giá giảm dần"] as const;
const finishOptions = ["Thường", "Foil"] as const;
const collectionPageSize = 24;

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
  const [finish, setFinish] = useState("");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>("Theo tên");
  const [onlySelected, setOnlySelected] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<CollectionCard | null>(null);
  const [visibleCount, setVisibleCount] = useState(collectionPageSize);
  const ownedCards = useMemo(() => groupCollectionCards(cards), [cards]);

  const filterOptions = useMemo(
    () => ({
      sets: mergeValues(
        RIFTBOUND_SET_NAMES,
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
      const matchesFinish =
        !finish ||
        card.variants.some((variant) =>
          finish === "Foil"
            ? variant.finish === "Foil"
            : variant.finish === "No Foil",
        );
      const matchesSelected =
        !onlySelected ||
        card.variants.some((variant) =>
          items.some(
            (item) =>
              item.key ===
              cartItemKey(
                sellerKey,
                variant.id,
                variant.finish,
                variant.condition,
              ),
          ),
        );
      return (
        matchesQuery &&
        matchesSet &&
        matchesType &&
        matchesRarity &&
        matchesFaction &&
        matchesFinish &&
        matchesSelected
      );
    });

    return matches.sort((a, b) => compareCards(a, b, sort));
  }, [
    faction,
    finish,
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
    Boolean(set || type || rarity || faction || finish || onlySelected);

  useEffect(() => {
    setVisibleCount(collectionPageSize);
  }, [faction, finish, onlySelected, query, rarity, set, sort, type]);
  const clearFilters = () => {
    setQuery("");
    setSet("");
    setType("");
    setRarity("");
    setFaction("");
    setFinish("");
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
            className="h-11 bg-card pr-11 pl-10 text-base sm:h-9 sm:pr-9 sm:pl-9 sm:text-xs"
            placeholder="Tìm card, set hoặc mã số..."
            aria-label="Tìm trong bộ sưu tập"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-0 grid size-11 -translate-y-1/2 place-items-center text-muted-foreground hover:text-foreground sm:right-1 sm:size-9"
              aria-label="Xoá tìm kiếm"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="relative z-30 mb-5 overflow-visible rounded-sm border bg-card/60">
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
            "flex-col items-stretch gap-2 px-3 py-3 text-left sm:flex sm:flex-row sm:flex-wrap sm:items-center",
            filtersOpen ? "flex border-t sm:border-t-0" : "hidden",
          )}
          aria-label="Bộ lọc card"
        >
          <FilterDropdown
            label="Set"
            value={set}
            options={filterOptions.sets}
            onChange={setSet}
            className="w-full [&>summary]:w-full sm:w-auto sm:[&>summary]:min-w-48"
          />
          <FilterDropdown
            label="Loại card"
            value={type}
            options={filterOptions.types}
            onChange={setType}
            className="w-full [&>summary]:w-full sm:w-auto"
          />
          <FilterDropdown
            label="Độ hiếm"
            value={rarity}
            options={filterOptions.rarities}
            onChange={setRarity}
            className="w-full [&>summary]:w-full sm:w-auto"
          />
          <DomainFilter
            value={faction}
            options={filterOptions.domains}
            onChange={setFaction}
            className="w-full [&>summary]:w-full sm:w-auto"
          />
          <FilterDropdown
            label="Phiên bản"
            value={finish}
            options={finishOptions}
            onChange={setFinish}
            className="w-full [&>summary]:w-full sm:w-auto"
          />
          {!isOwner && (
            <label
              className={cn(
                "flex h-11 cursor-pointer items-center gap-2 rounded-sm border px-3 text-sm font-bold transition-colors sm:h-8 sm:text-[10px]",
                onlySelected && "border-[#8ba55e] bg-[#edf3e5] text-[#506b32]",
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
            onChange={(value) => setSort(value as (typeof sortOptions)[number])}
            allowEmpty={false}
            className="w-full [&>summary]:w-full sm:w-auto sm:[&>summary]:min-w-36"
          />
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {filteredCards.length}/{ownedCards.length} card
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 text-left text-sm font-bold text-[#607d35] hover:underline sm:min-h-0 sm:text-[10px]"
            >
              <X className="size-3" /> Xoá lọc
            </button>
          )}
        </div>
      </div>

      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 max-[359px]:grid-cols-1 sm:grid-cols-3 lg:grid-cols-6">
          {filteredCards.slice(0, visibleCount).map((card) => {
            const variantKeys = new Set(
              card.variants.map((variant) =>
                cartItemKey(
                  sellerKey,
                  variant.id,
                  variant.finish,
                  variant.condition,
                ),
              ),
            );
            const variantStates = card.variants.map((variant) => ({
              variant,
              cartItem: items.find(
                (item) =>
                  item.key ===
                  cartItemKey(
                    sellerKey,
                    variant.id,
                    variant.finish,
                    variant.condition,
                  ),
              ),
            }));
            const cartItem = variantStates[0]?.cartItem;
            const selectedQuantity = items.reduce(
              (total, item) =>
                total + (variantKeys.has(item.key) ? item.quantity : 0),
              0,
            );
            const hasBoth = card.variants.length > 1;
            const atLimit = (cartItem?.quantity ?? 0) >= card.quantity;
            const addCardToCart = (variant = card.variants[0]) =>
              addItem({
                cardId: variant.id,
                seller: sellerKey,
                sellerDisplayName: displayName,
                sellerFacebookUrl: facebookUrl ?? undefined,
                name: card.name,
                set: card.set,
                number: card.number,
                finish: variant.finish,
                condition: variant.condition,
                price: variant.price,
                imageUrl: card.imageUrl,
                glyph: card.glyph,
                gradient: card.gradient,
                stock: variant.quantity,
              });
            return (
              <Card
                key={card.id}
                role="button"
                tabIndex={0}
                aria-label={`Xem ảnh ${card.name}`}
                onClick={() => {
                  if (
                    window.matchMedia("(min-width: 640px)").matches &&
                    card.imageUrl
                  )
                    setPreviewCard(card);
                }}
                onKeyDown={(event) => {
                  if (
                    window.matchMedia("(min-width: 640px)").matches &&
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ") &&
                    card.imageUrl
                  ) {
                    event.preventDefault();
                    setPreviewCard(card);
                  }
                }}
                className={cn(
                  "group relative flex h-full cursor-default flex-col overflow-visible transition-all sm:hover:z-20 sm:hover:-translate-y-1 sm:hover:border-[#8ba55e] sm:hover:shadow-lg sm:focus-within:z-20",
                  selectedQuantity > 0 && "z-30 hover:z-30 focus-within:z-30",
                )}
              >
                {selectedQuantity > 0 && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      variantStates.forEach(
                        ({ cartItem: selected }) =>
                          selected && updateQuantity(selected.key, 0),
                      );
                    }}
                    className="absolute top-0 right-0 z-30 hidden min-w-8 translate-x-1/2 -translate-y-1/2 place-items-center rounded-sm border-2 border-card bg-accent px-2 py-1 text-[11px] font-black text-accent-foreground shadow-md sm:grid"
                    aria-label={`Xoá ${card.name} khỏi giỏ`}
                    title="Xoá khỏi giỏ"
                  >
                    <span className="group-hover:hidden">
                      ×{selectedQuantity}
                    </span>
                    <Trash2 className="hidden size-3.5 group-hover:block" />
                  </button>
                )}
                <div
                  className={cn(
                    "relative m-3.5 mb-0 grid aspect-[469/655] place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br sm:m-2.5 sm:mb-0",
                    card.gradient,
                  )}
                >
                  {card.imageUrl && (
                    <Image
                      src={card.imageUrl}
                      alt={`Artwork của ${card.name}`}
                      fill
                      sizes="(max-width: 359px) 100vw, (max-width: 639px) 50vw, (max-width: 1023px) 33vw, 16vw"
                      className="object-cover"
                    />
                  )}
                  {!isOwner && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-[30%] z-20 hidden justify-center px-2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100 sm:flex">
                      {hasBoth ? (
                        <div className="pointer-events-auto space-y-1 rounded-sm border border-white/70 bg-card/95 p-1 shadow-xl backdrop-blur-md">
                          {variantStates.map(({ variant, cartItem: selected }) => {
                            const label = variant.finish === "Foil" ? "Foil" : "Thường";
                            const limit = (selected?.quantity ?? 0) >= variant.quantity;
                            return (
                              <div key={variant.finish} className="flex items-center gap-1">
                                <span className="w-12 text-[9px] font-black">{label}</span>
                                {selected ? (
                                  <>
                                    <button type="button" onClick={(event) => { event.stopPropagation(); updateQuantity(selected.key, selected.quantity - 1); }} className="grid size-6 place-items-center rounded-sm hover:bg-secondary" aria-label={`Giảm ${label}`}>
                                      <Minus className="size-3" />
                                    </button>
                                    <span className="min-w-9 text-center text-[9px] font-black">{selected.quantity}/{variant.quantity}</span>
                                    <button type="button" disabled={limit} onClick={(event) => { event.stopPropagation(); updateQuantity(selected.key, selected.quantity + 1); }} className="grid size-6 place-items-center rounded-sm hover:bg-secondary disabled:opacity-30" aria-label={`Tăng ${label}`}>
                                      <Plus className="size-3" />
                                    </button>
                                  </>
                                ) : (
                                  <button type="button" onClick={(event) => { event.stopPropagation(); addCardToCart(variant); }} className="flex h-6 flex-1 items-center justify-center gap-1 rounded-sm bg-accent px-2 text-[9px] font-black" aria-label={`Thêm ${card.name} ${label}`}>
                                    <ShoppingBag className="size-3" /> Thêm
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : cartItem ? (
                        <div className="pointer-events-auto flex items-center gap-0.5 rounded-sm border border-white/70 bg-card/95 p-1 shadow-xl backdrop-blur-md">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              updateQuantity(
                                cartItem.key,
                                cartItem.quantity - 1,
                              );
                            }}
                            className="grid size-7 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                            className="min-w-8 rounded-sm px-1 text-center text-[10px] font-black hover:bg-secondary disabled:cursor-default disabled:opacity-60"
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
                            className="grid size-7 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
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
                          className="pointer-events-auto size-10 cursor-pointer rounded-sm border border-white/70 shadow-xl transition-transform hover:scale-105"
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
                <div className="flex flex-1">
                  <CardContent className="flex w-full flex-col p-3 pb-2">
                    <div className="card-title mt-1 min-w-0 overflow-hidden">
                        <h3 className="card-title-text-auto w-max min-w-full whitespace-nowrap font-serif text-sm leading-6 font-semibold sm:text-base">
                          {card.name}
                        </h3>
                    </div>
                    <div className="mt-1 flex h-7 items-center gap-1.5">
                      <span className="inline-flex h-5 min-w-9 shrink-0 items-center justify-center rounded-sm border border-[#4f86c6]/70 bg-[#dcecff] px-1.5 text-center text-[8px] leading-none font-black tracking-wider text-[#24558d]">
                        {setCode(card.set)}
                      </span>
                      {card.variants.map((variant) => (
                        <span
                          key={variant.finish}
                          className={cn(
                            "rounded-sm border px-1.5 py-0.5 text-[9px] font-bold",
                            variant.finish === "Foil"
                              ? "border-primary/30 bg-accent/40 text-primary"
                              : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {variant.finish === "Foil" ? "Foil" : "Thường"}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto grid h-[3.75rem] grid-rows-2 gap-1 border-t pt-1.5">
                      {[...card.variants, null].slice(0, 2).map((variant, index) =>
                        variant ? (
                          <div key={variant.finish} className="flex min-h-6 items-center justify-between">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={cn(
                                  "h-5 w-2 shrink-0 rounded-[2px] border",
                                  variant.finish === "Foil"
                                    ? "border-primary/30 bg-accent"
                                    : "border-border bg-secondary",
                                )}
                                aria-label={variant.finish === "Foil" ? "Foil" : "Thường"}
                                title={variant.finish === "Foil" ? "Foil" : "Thường"}
                              />
                              <strong className="min-w-0 font-serif text-sm">{variant.price}</strong>
                            </div>
                            <span className="grid min-w-7 place-items-center rounded-sm border bg-secondary px-1.5 py-0.5 text-[9px] font-black">×{variant.quantity}</span>
                          </div>
                        ) : (
                          <div key={`empty-${index}`} aria-hidden="true" />
                        ),
                      )}
                    </div>
                    {!isOwner && (
                      <div className="mt-1.5 flex min-h-[5.25rem] flex-col justify-end border-t pt-1.5 sm:hidden">
                        {hasBoth ? (
                          <div className="space-y-1">
                            {variantStates.map(({ variant, cartItem: selected }) => {
                              const label = variant.finish === "Foil" ? "Foil" : "Thường";
                              return selected ? (
                                <div key={variant.finish} className="flex h-9 items-center overflow-hidden rounded-md border bg-background">
                                  <span className="w-12 pl-2 text-[9px] font-black">{label}</span>
                                  <button type="button" onClick={(event) => { event.stopPropagation(); updateQuantity(selected.key, selected.quantity - 1); }} className="grid h-full flex-1 place-items-center"><Minus className="size-3" /></button>
                                  <QuantityInput
                                    itemKey={selected.key}
                                    quantity={selected.quantity}
                                    max={variant.quantity}
                                    updateQuantity={updateQuantity}
                                  />
                                  <button type="button" disabled={selected.quantity >= variant.quantity} onClick={(event) => { event.stopPropagation(); updateQuantity(selected.key, selected.quantity + 1); }} className="grid h-full flex-1 place-items-center disabled:opacity-30"><Plus className="size-3" /></button>
                                </div>
                              ) : (
                                <Button key={variant.finish} type="button" variant="accent" size="sm" className="h-9 w-full text-xs" onClick={(event) => { event.stopPropagation(); addCardToCart(variant); }}>
                                  <ShoppingBag className="size-3" /> {label}
                                </Button>
                              );
                            })}
                          </div>
                        ) : cartItem ? (
                          <div
                            className="flex h-9 items-center overflow-hidden rounded-md border bg-background"
                            aria-label={`${card.name}: đã chọn ${cartItem.quantity} trên ${card.quantity}`}
                          >
                            <span className="w-12 pl-2 text-[9px] font-black">
                              {card.finish === "Foil" ? "Foil" : "Thường"}
                            </span>
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
                              <Minus className="size-3" />
                            </button>
                            <QuantityInput
                              itemKey={cartItem.key}
                              quantity={cartItem.quantity}
                              max={card.quantity}
                              updateQuantity={updateQuantity}
                            />
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
                              <Plus className="size-3" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="accent"
                            size="sm"
                            className="h-9 w-full px-2 text-xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              addCardToCart();
                            }}
                            aria-label={`Thêm ${card.name} vào giỏ`}
                          >
                            <ShoppingBag
                              className="size-3"
                              strokeWidth={2.25}
                            />
                            {card.finish === "Foil" ? "Foil" : "Thường"}
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

      {filteredCards.length > visibleCount && (
        <div className="mt-5 flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={() =>
              setVisibleCount((count) => count + collectionPageSize)
            }
          >
            Xem thêm {Math.min(collectionPageSize, filteredCards.length - visibleCount)} card
          </Button>
        </div>
      )}

      {previewCard?.imageUrl && (
        <CardPreviewDialog
          card={previewCard}
          imageUrl={previewCard.imageUrl}
          close={() => setPreviewCard(null)}
        />
      )}
    </>
  );
}

function CardPreviewDialog({
  card,
  imageUrl,
  close,
}: {
  card: CollectionCard;
  imageUrl: string;
  close: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModalDialog(panelRef, close);

  return (
    <div
      className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Ảnh ${card.name}`}
        className="relative flex max-h-full max-w-full items-center outline-none"
      >
        <Image
          src={imageUrl}
          alt={card.name}
          width={744}
          height={1039}
          className="max-h-[calc(100dvh-2rem)] max-w-full cursor-default rounded-lg object-contain shadow-2xl sm:max-h-[calc(100dvh-4rem)]"
        />
        <button
          type="button"
          onClick={close}
          className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/85 sm:-top-4 sm:-right-4"
          aria-label="Đóng ảnh"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}

function mergeValues(requiredValues: string[], actualValues: string[]) {
  return [...new Set([...requiredValues, ...actualValues.filter(Boolean)])];
}

function QuantityInput({
  itemKey,
  quantity,
  max,
  updateQuantity,
}: {
  itemKey: string;
  quantity: number;
  max: number;
  updateQuantity: (key: string, quantity: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => setDraft(String(quantity)), [quantity]);

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    const next = Number.isFinite(parsed)
      ? Math.max(0, Math.min(parsed, max))
      : quantity;
    setDraft(String(next));
    setEditing(false);
    updateQuantity(itemKey, next);
  };

  return (
    <label className="grid h-full min-w-16 grid-cols-[1fr_auto_1fr] items-center border-x bg-card px-1 text-xs font-black">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={editing ? draft : quantity}
        onFocus={(event) => {
          setEditing(true);
          event.currentTarget.select();
        }}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "") return setDraft("");
          const parsed = Number.parseInt(value, 10);
          setDraft(String(Math.min(parsed, max)));
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        onClick={(event) => event.stopPropagation()}
        aria-label="Số lượng đã chọn"
        className="w-full appearance-none bg-transparent text-right font-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span aria-hidden="true">/</span>
      <span aria-hidden="true" className="text-left">{max}</span>
    </label>
  );
}

function groupCollectionCards(cards: CollectionCard[]): GroupedCollectionCard[] {
  const groups = new Map<string, CollectionCard[]>();
  cards.forEach((card) =>
    groups.set(card.id, [...(groups.get(card.id) ?? []), card]),
  );
  return [...groups.values()].map((variants) => {
    const sorted = [...variants].sort((a, b) =>
      a.finish === b.finish ? 0 : a.finish === "No Foil" ? -1 : 1,
    );
    return {
      ...sorted[0],
      quantity: sorted.reduce((total, variant) => total + variant.quantity, 0),
      variants: sorted,
    };
  });
}

function setCode(set: string) {
  return (
    RIFTBOUND_SET_CODES[set] ??
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
