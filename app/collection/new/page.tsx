"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Download, Loader2, Minus, Plus, Save, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import { AccountLink } from "@/components/account-link";
import { DomainFilter, FilterDropdown } from "@/components/domain-filter";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { currencyConfig, formatCurrency } from "@/lib/currency";
import { useDebounce } from "@/lib/use-debounce";
import {
  RIFTBOUND_CARD_TYPES,
  RIFTBOUND_DOMAINS,
  RIFTBOUND_RARITIES,
} from "@/lib/riftbound-constants";

type CatalogCard = {
  id: string;
  collectorNumber: number;
  name: string;
  set: string;
  rarity: string;
  type?: string;
  faction?: string;
  domains?: string[];
  supertype?: string | null;
  isNew?: boolean;
  art?: { thumbnailURL?: string };
  listingCount?: number;
  lowestListingPrice?: number;
  highestListingPrice?: number;
  tcgPrice?: number;
};

type ApiCard = {
  id: string;
  name: string;
  imageUrl: string;
  tcgplayerId: string;
  collectorNumber: number;
  set: string;
  domain: string[];
  type: string;
  supertype: string | null;
  rarity: string;
  isNew: boolean;
  listingCount?: number;
  lowestListingPrice?: number;
  highestListingPrice?: number;
  tcgPrice?: number;
};

type ApiCardPage = {
  items?: ApiCard[];
  total?: number;
  page?: number;
  size?: number;
  pages?: number;
};

type RowEdit = { quantity: number; minPrice: number; tcgMultiplier: number };

const draftKey = "ripbao.collection.draft.v2";
const pageSize = 25;
const fallbackCards: CatalogCard[] = [
  { id: "jinx-rebel", collectorNumber: 181, name: "Jinx, Rebel", set: "Origins", rarity: "Epic", type: "Champion", faction: "Chaos" },
  { id: "ahri-nine-tailed", collectorNumber: 42, name: "Ahri, Nine-Tailed", set: "Origins", rarity: "Rare", type: "Legend", faction: "Calm" },
  { id: "yasuo-unforgiven", collectorNumber: 96, name: "Yasuo, Unforgiven", set: "Origins", rarity: "Epic", type: "Champion", faction: "Calm" },
  { id: "kaisa-survivor", collectorNumber: 27, name: "Kai'Sa, Survivor", set: "Spiritforged", rarity: "Rare", type: "Champion", faction: "Order" },
  { id: "viktor-innovator", collectorNumber: 154, name: "Viktor, Innovator", set: "Spiritforged", rarity: "Epic", type: "Champion", faction: "Mind" },
];

export default function NewCollectionPage() {
  const [cards, setCards] = useState<CatalogCard[]>([]);
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const requestedQueryRef = useRef(debouncedQuery);
  const [setFilter, setSetFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [factionFilter, setFactionFilter] = useState("");
  const [onlyAdded, setOnlyAdded] = useState(false);
  const [rarityMinimums, setRarityMinimums] = useState<Record<string, number>>(() => Object.fromEntries(Object.entries(currencyConfig.quickMinimums).map(([rarity, value]) => [rarity[0].toUpperCase() + rarity.slice(1), value])));
  const [rarityMultipliers, setRarityMultipliers] = useState<Record<string, number>>({ Common: 0.8, Uncommon: 0.85, Rare: 0.9, Epic: 0.95, Legendary: 1 });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [quickPricingOpen, setQuickPricingOpen] = useState(false);
  const searchPending = query.trim() !== debouncedQuery.trim() || (loading && page === 1 && Boolean(debouncedQuery.trim()));

  useEffect(() => {
    try {
      const draft = window.localStorage.getItem(draftKey);
      if (draft) setEdits(JSON.parse(draft) as Record<string, RowEdit>);
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, []);

  useEffect(() => {
    if (onlyAdded && page > 1) return;

    if (requestedQueryRef.current !== debouncedQuery) {
      requestedQueryRef.current = debouncedQuery;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    const controller = new AbortController();
    const params = new URLSearchParams();
    const name = debouncedQuery.trim();
    params.set("page", String(page));
    params.set("size", String(pageSize));
    if (name) {
      params.set("name", name);
      params.set("match", "fuzzy");
    }

    setLoading(true);
    fetch(`/api/riftbound/cards?${params}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: ApiCardPage) => {
        const incomingCards = data.items?.map(toCatalogCard) ?? [];
        setCards((current) => uniqueCardsByName(page === 1 ? incomingCards : [...current, ...incomingCards]));
        setPageCount(Math.max(1, data.pages ?? 1));
        setTotalCards(data.total ?? data.items?.length ?? 0);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (page === 1) {
          setCards(name ? [] : fallbackCards);
          setPageCount(1);
          setTotalCards(name ? 0 : fallbackCards.length);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, onlyAdded, page]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || onlyAdded || loading || searchPending || page >= pageCount) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPage((current) => Math.min(pageCount, current + 1));
    }, { root: scrollContainerRef.current, rootMargin: "300px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, onlyAdded, page, pageCount, searchPending]);

  const sets = useMemo(() => [...new Set(cards.map((card) => card.set))].sort(), [cards]);
  const types = RIFTBOUND_CARD_TYPES;
  const rarities = RIFTBOUND_RARITIES;
  const domains = RIFTBOUND_DOMAINS;
  const visibleCards = useMemo(() => {
    return cards.filter((card) => {
      const edit = edits[card.id];
      return (!setFilter || card.set === setFilter)
        && (!typeFilter || card.type === typeFilter)
        && (!rarityFilter || card.rarity === rarityFilter)
        && (!factionFilter || card.domains?.includes(factionFilter) || card.faction === factionFilter)
        && (!onlyAdded || (edit?.quantity ?? 0) > 0);
    });
  }, [cards, edits, factionFilter, onlyAdded, rarityFilter, setFilter, typeFilter]);
  const addedCount = Object.values(edits).reduce((total, edit) => total + (edit.quantity > 0 ? 1 : 0), 0);
  const totalQuantity = Object.values(edits).reduce((total, edit) => total + edit.quantity, 0);
  const raritySummary = useMemo(() => {
    const quantities: Record<string, number> = {};
    cards.forEach((card) => {
      const quantity = edits[card.id]?.quantity ?? 0;
      if (quantity > 0) quantities[card.rarity] = (quantities[card.rarity] ?? 0) + quantity;
    });
    return Object.entries(quantities).sort(([a], [b]) => a.localeCompare(b));
  }, [cards, edits]);

  const updateRow = (id: string, patch: Partial<RowEdit>) => setEdits((current) => ({
    ...current,
    [id]: { ...normalizeEdit(current[id]), ...patch },
  }));

  const applyBulkPricing = () => setEdits((current) => {
    const next = { ...current };
    cards.forEach((card) => {
      const edit = next[card.id];
      if (edit?.quantity > 0) next[card.id] = { ...edit, minPrice: rarityMinimums[card.rarity] ?? defaultMinimum(card.rarity), tcgMultiplier: rarityMultipliers[card.rarity] ?? defaultMultiplier(card.rarity) };
    });
    return next;
  });
  const saveDraft = () => {
    window.localStorage.setItem(draftKey, JSON.stringify(edits));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const exportCsv = () => {
    const rows = cards.map((card) => {
      const edit = normalizeEdit(edits[card.id]);
      return [card.id, card.name, card.set, card.collectorNumber, card.rarity, card.type ?? "", card.faction ?? "", edit.quantity, edit.minPrice, edit.tcgMultiplier];
    });
    const csv = [["card_id", "name", "set", "number", "rarity", "type", "faction", "quantity", `min_price_${currencyConfig.code.toLocaleLowerCase()}`, "tcg_multiplier"], ...rows]
      .map((row) => row.map(csvCell).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    link.download = "ripbao-collection.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const lines = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
    const imported: Record<string, RowEdit> = {};
    for (const line of lines.slice(1)) {
      const [id, , , , , , , quantity, minPrice, tcgMultiplier] = parseCsvLine(line);
      if (!id || !cards.some((card) => card.id === id)) continue;
      imported[id] = {
        quantity: Math.max(0, Number(quantity) || 0),
        minPrice: Math.max(0, Number(minPrice) || 0),
        tcgMultiplier: Math.max(0, Number(tcgMultiplier) || 0.9),
      };
    }
    setEdits((current) => ({ ...current, ...imported }));
    event.target.value = "";
  };

  return (
    <main className="collection-editor paper-grid min-h-dvh w-full max-w-full overflow-x-hidden">
      <div className="mx-auto box-border w-full max-w-[1440px] min-w-0 px-4 py-5 sm:px-7">
        <header className="flex items-center justify-between border-b pb-4"><Link href="/" className="flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]"><span className="grid h-9 w-8 place-items-center rounded-sm border-2 border-accent bg-primary font-serif text-lg text-accent">R</span> RIPBAO</Link><AccountLink /></header>

        <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div><Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Quay lại</Link><h1 className="font-serif text-2xl font-semibold">Tạo collection</h1><div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground"><span><strong className="text-sm text-foreground">{totalQuantity}</strong> card</span><span>·</span><span><strong className="text-sm text-foreground">{addedCount}</strong> loại</span>{raritySummary.map(([rarity, quantity]) => <span key={rarity} className="rounded-sm border bg-card px-1.5 py-0.5"><strong className="text-foreground">{rarity}</strong> {quantity}</span>)}</div></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={exportCsv} disabled={cards.length === 0}><Download className="size-3.5" /> Xuất file mẫu</Button><div className="relative"><Button variant="outline" size="sm" onClick={() => setQuickPricingOpen((open) => !open)} aria-expanded={quickPricingOpen}><SlidersHorizontal className="size-3.5" /> Thiết lập giá <ChevronDown className={cn("size-3 transition-transform", quickPricingOpen && "rotate-180")} /></Button>{quickPricingOpen && <div className="absolute top-full right-0 z-40 mt-2 w-[min(92vw,390px)] rounded-sm border bg-card p-3 shadow-xl"><div className="mb-3"><strong className="text-[11px]">Thiết lập giá nhanh</strong><p className="mt-0.5 text-[8px] text-muted-foreground">Đặt Min và hệ số riêng theo độ hiếm.</p></div><div className="grid grid-cols-[1fr_110px_90px] items-center gap-x-2 gap-y-1.5"><span className="text-[8px] font-bold text-muted-foreground uppercase">Độ hiếm</span><span className="text-[8px] font-bold text-muted-foreground uppercase">Min ({currencyConfig.code})</span><span className="text-[8px] font-bold text-muted-foreground uppercase">× TCG</span>{rarities.map((rarity) => <div key={rarity} className="contents"><strong className="truncate text-[10px]">{rarity}</strong><div className="relative"><span className="absolute top-1/2 left-2 -translate-y-1/2 text-[9px] text-muted-foreground">{currencyConfig.symbol}</span><input type="number" min="0" step={currencyConfig.inputStep} value={rarityMinimums[rarity] ?? defaultMinimum(rarity)} onChange={(event) => setRarityMinimums((current) => ({ ...current, [rarity]: event.target.valueAsNumber || 0 }))} className="h-7 w-full rounded-sm border bg-background pr-2 pl-6 text-[10px] font-bold" /></div><input type="number" min="0" step="0.05" value={rarityMultipliers[rarity] ?? defaultMultiplier(rarity)} onChange={(event) => setRarityMultipliers((current) => ({ ...current, [rarity]: event.target.valueAsNumber || 0 }))} className="h-7 w-full rounded-sm border bg-background px-2 text-center text-[10px] font-bold" /></div>)}</div><div className="mt-3 flex items-center justify-between border-t pt-3"><span className="text-[8px] text-muted-foreground">{addedCount} loại card sẽ được cập nhật</span><Button size="sm" className="h-8 text-[10px]" onClick={() => { applyBulkPricing(); setQuickPricingOpen(false); }} disabled={addedCount === 0}><Check className="size-3" /> Áp dụng</Button></div></div>}</div><label className={buttonVariants({ variant: "outline", size: "sm" })}><Upload className="size-3.5" /> Nhập CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} className="sr-only" /></label><Button size="sm" onClick={saveDraft}>{saved ? <Check className="size-3.5" /> : <Save className="size-3.5" />}{saved ? "Đã lưu" : "Lưu nháp"}</Button></div>
        </div>

        <div className="mb-3 grid w-full min-w-0 gap-2 rounded-sm border bg-card p-3 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_repeat(4,140px)_auto]">
          <div className="relative"><Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-8 rounded-sm pr-8 pl-8 text-xs" placeholder="Tìm tên, set hoặc mã card..." aria-busy={searchPending} />{searchPending ? <Loader2 className="absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" /> : query && <button type="button" onClick={() => setQuery("")} className="absolute top-1/2 right-1.5 grid size-5 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Xoá nội dung tìm kiếm"><X className="size-3" /></button>}</div>
          <FilterDropdown label="Set" value={setFilter} options={sets} onChange={setSetFilter} className="min-w-0 [&>summary]:w-full [&>summary]:min-w-0" />
          <FilterDropdown label="Loại" value={typeFilter} options={types} onChange={setTypeFilter} />
          <FilterDropdown label="Độ hiếm" value={rarityFilter} options={rarities} onChange={setRarityFilter} />
          <DomainFilter value={factionFilter} options={domains} onChange={setFactionFilter} />
          <label className="flex h-8 items-center gap-2 rounded-sm border px-3 text-[10px] font-bold"><input type="checkbox" checked={onlyAdded} onChange={(event) => setOnlyAdded(event.target.checked)} /> Chỉ card đã nhập</label>
        </div>

        <div ref={scrollContainerRef} className="collection-scrollbar w-full max-w-full min-w-0 max-h-[calc(100dvh-300px)] min-h-80 overflow-auto rounded-sm border bg-card shadow-sm">
          <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-[10px] [&_td]:overflow-hidden">
            <thead className="sticky top-0 z-20 bg-primary text-primary-foreground"><tr><th className="w-14 px-2 py-2">Ảnh</th><th className="w-44 px-2 py-2">Card</th><th className="w-36 px-2 py-2">Set / Mã</th><th className="w-24 px-2 py-2 text-center">Đang rao</th><th className="w-44 px-2 py-2">Khoảng giá</th><th className="w-28 px-2 py-2 text-center">Số lượng</th><th className="w-32 border-l border-white/15 py-2 pr-2 pl-4">Giá Min ({currencyConfig.code})</th><th className="w-28 px-2 py-2">× TCG</th><th className="w-32 px-2 py-2">Giá cuối</th></tr></thead>
            <tbody>{loading && cards.length === 0 ? <tr><td colSpan={9} className="h-40 text-center"><Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /></td></tr> : visibleCards.map((card) => {
              const edit = normalizeEdit(edits[card.id]);
              return <tr key={card.id} className={edit.quantity > 0 ? "border-t bg-accent/10" : "border-t hover:bg-secondary/40"}>
                <td className="p-1.5"><div className="grid h-10 aspect-[469/655] place-items-center overflow-hidden rounded-[3px] border bg-secondary">{card.art?.thumbnailURL && <img src={card.art.thumbnailURL} alt="" loading="lazy" decoding="async" className="size-full object-cover" />}</div></td>
                <td className="px-2 py-1.5"><strong className="block truncate text-[11px]" title={card.name}>{card.name}</strong></td>
                <td className="px-2 py-1.5"><span className="font-bold">{card.set}</span><span className="ml-1 text-muted-foreground">#{card.collectorNumber}</span></td><td className="px-2 py-1.5 text-center font-bold">{(card.listingCount ?? 0).toLocaleString("vi-VN")}</td><td className="px-2 py-1.5"><ListingPriceRange card={card} /></td>
                <td className="px-2 py-1.5"><div className="mx-auto flex w-fit items-center overflow-hidden rounded-sm border bg-background"><button type="button" className="grid size-7 place-items-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30" disabled={edit.quantity <= 0} onClick={() => updateRow(card.id, { quantity: Math.max(0, edit.quantity - 1) })} aria-label={`Giảm số lượng ${card.name}`}><Minus className="size-3" /></button><input type="number" min="0" step="1" value={edit.quantity} onFocus={(event) => event.currentTarget.select()} onChange={(event) => updateRow(card.id, { quantity: Math.max(0, event.target.valueAsNumber || 0) })} className="h-7 w-10 border-x bg-background px-1 text-center text-xs font-black outline-none focus:ring-2 focus:ring-inset focus:ring-ring/30" aria-label={`Số lượng ${card.name}`} /><button type="button" className="grid size-7 place-items-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" onClick={() => updateRow(card.id, { quantity: edit.quantity + 1 })} aria-label={`Tăng số lượng ${card.name}`}><Plus className="size-3" /></button></div></td>
                <td className="border-l bg-card/35 py-1.5 pr-2 pl-4"><div className="relative"><span className="absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground">{currencyConfig.symbol}</span><input type="number" min="0" step={currencyConfig.inputStep} value={edit.minPrice} onChange={(event) => updateRow(card.id, { minPrice: event.target.valueAsNumber || 0 })} className="h-7 w-full rounded-sm border bg-background pr-2 pl-6 font-bold" /></div></td>
                <td className="px-2 py-1.5"><input type="number" min="0" step="0.05" value={edit.tcgMultiplier} onChange={(event) => updateRow(card.id, { tcgMultiplier: event.target.valueAsNumber || 0 })} className="h-7 w-full rounded-sm border bg-background px-2 text-center font-bold" /></td>
                <td className="px-2 py-1.5"><FinalPrice card={card} edit={edit} /></td>
              </tr>;
            })}</tbody>
          </table>
          {!loading && visibleCards.length === 0 && <div className="grid h-40 place-items-center text-xs text-muted-foreground">Không tìm thấy card phù hợp.</div>}
          <div ref={loadMoreRef} className="grid min-h-10 place-items-center border-t bg-card px-3 py-2 text-[10px] text-muted-foreground">
            {onlyAdded ? `Đã hiển thị ${visibleCards.length} card đang có` : loading && page > 1 ? <span className="flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" /> Đang tải thêm card...</span> : page < pageCount ? `Đã tải ${cards.length}/${totalCards.toLocaleString("vi-VN")} card · Cuộn xuống để xem thêm` : `Đã hiển thị ${cards.length} card`}
          </div>
        </div>
      </div>
    </main>
  );
}

function toCatalogCard(card: ApiCard): CatalogCard {
  return {
    id: card.id,
    collectorNumber: card.collectorNumber,
    name: card.name,
    set: card.set,
    rarity: card.rarity,
    type: card.type,
    faction: card.domain[0],
    domains: card.domain,
    supertype: card.supertype,
    isNew: card.isNew,
    art: { thumbnailURL: card.imageUrl },
    listingCount: card.listingCount,
    lowestListingPrice: card.lowestListingPrice,
    highestListingPrice: card.highestListingPrice,
    tcgPrice: card.tcgPrice,
  };
}

function uniqueCardsByName(cards: CatalogCard[]) {
  const names = new Set<string>();

  return cards.filter((card) => {
    const name = card.name.trim().toLocaleLowerCase("en");
    if (names.has(name)) return false;
    names.add(name);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

function ListingPriceRange({ card }: { card: CatalogCard }) {
  const lowest = card.lowestListingPrice;
  const highest = card.highestListingPrice;

  return <span className="block truncate text-[9px] text-muted-foreground">{lowest == null || highest == null ? "—" : `${formatCurrency(lowest)} – ${formatCurrency(highest)}`}</span>;
}

function FinalPrice({ card, edit }: { card: CatalogCard; edit: RowEdit }) {
  const tcgBasedPrice = card.tcgPrice == null ? 0 : card.tcgPrice * edit.tcgMultiplier;
  const price = Math.max(edit.minPrice, tcgBasedPrice);

  return <strong className="block truncate text-[10px] text-[#506b32]" title="max(Giá Min, giá TCG × hệ số)">{price > 0 ? formatCurrency(price) : "—"}</strong>;
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { cells.push(value); value = ""; }
    else value += character;
  }
  cells.push(value);
  return cells;
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}

function normalizeEdit(edit?: Partial<RowEdit>): RowEdit {
  return { quantity: edit?.quantity ?? 0, minPrice: edit?.minPrice ?? 0, tcgMultiplier: edit?.tcgMultiplier ?? 0.9 };
}

function defaultMinimum(rarity: string) {
  return currencyConfig.quickMinimums[rarity.toLocaleLowerCase()] ?? 0;
}

function defaultMultiplier(rarity: string) {
  const defaults: Record<string, number> = { common: 0.8, uncommon: 0.85, rare: 0.9, epic: 0.95, legendary: 1 };
  return defaults[rarity.toLocaleLowerCase()] ?? 0.9;
}
