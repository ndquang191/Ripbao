"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

type TradingLocation = { id: string; name: string; detail: string };
type TradeOptionId = "nexus-night" | "skirmish" | "ship-inner-city" | "ship-nationwide";
type TradingData = { locations: TradingLocation[]; selectedOptions: TradeOptionId[] };
type TradingApiItem = { id: string; optionId: string | null; name: string; detail: string | null; enabled: boolean };

const tradeOptions: Array<{ id: TradeOptionId; label: string }> = [
  { id: "nexus-night", label: "Nexus Night" },
  { id: "skirmish", label: "Skirmish" },
  { id: "ship-inner-city", label: "Ship nội thành" },
  { id: "ship-nationwide", label: "Ship toàn quốc" },
];

const validOptionIds = new Set(tradeOptions.map((option) => option.id));
const cacheLifetime = 5 * 60 * 1000;
const tradingCache = new Map<string, TradingData & { cachedAt: number }>();
const pendingRequests = new Map<string, Promise<TradingData>>();

function readCachedTrading(username: string) {
  const cached = tradingCache.get(username);
  if (!cached || Date.now() - cached.cachedAt > cacheLifetime) {
    tradingCache.delete(username);
    return null;
  }
  return cached;
}

function loadTrading(username: string) {
  const cached = readCachedTrading(username);
  if (cached) return Promise.resolve(cached);

  const pending = pendingRequests.get(username);
  if (pending) return pending;

  const request = fetch(`/api/users/${encodeURIComponent(username)}/trading`)
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((data: { items?: TradingApiItem[] }) => {
      const items = data.items ?? [];
      const result: TradingData = {
        locations: items.filter((item) => item.optionId === null && item.enabled).map((item) => ({ id: item.id, name: item.name, detail: item.detail ?? "" })),
        selectedOptions: items.filter((item) => item.optionId && item.enabled).map((item) => item.optionId as TradeOptionId).filter((id) => validOptionIds.has(id)),
      };
      tradingCache.set(username, { ...result, cachedAt: Date.now() });
      return result;
    })
    .finally(() => pendingRequests.delete(username));

  pendingRequests.set(username, request);
  return request;
}

export function TradingLocations({ username }: { username: string }) {
  const normalizedUsername = username.toLocaleLowerCase();
  const { sessionUser } = useCart();
  const initialData = readCachedTrading(normalizedUsername);
  const [locations, setLocations] = useState<TradingLocation[]>(initialData?.locations ?? []);
  const [selectedOptions, setSelectedOptions] = useState<TradeOptionId[]>(initialData?.selectedOptions ?? []);
  const [ready, setReady] = useState(Boolean(initialData));
  const [isEditing, setIsEditing] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const initialScrollRef = useRef(0);

  useEffect(() => {
    let active = true;
    const cached = readCachedTrading(normalizedUsername);
    if (!cached) setReady(false);

    loadTrading(normalizedUsername).then((data) => {
      if (!active) return;
      setLocations(data.locations);
      setSelectedOptions(data.selectedOptions);
    }).catch(() => {
      if (!active) return;
      setLocations([]);
      setSelectedOptions([]);
    }).finally(() => {
      if (active) setReady(true);
    });

    return () => { active = false; };
  }, [normalizedUsername]);

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  function savePreferences(nextLocations: TradingLocation[], nextOptions: TradeOptionId[]) {
    tradingCache.set(normalizedUsername, { locations: nextLocations, selectedOptions: nextOptions, cachedAt: Date.now() });
    const items = [
      ...tradeOptions.map((option, position) => ({ optionId: option.id, name: option.label, enabled: nextOptions.includes(option.id), position })),
      ...nextLocations.map((location, index) => ({ optionId: null, name: location.name, detail: location.detail, enabled: true, position: 100 + index })),
    ];
    void fetch(`/api/users/${encodeURIComponent(normalizedUsername)}/trading`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
  }

  function addLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const detail = String(form.get("detail") ?? "").trim();
    if (!name) return;

    const nextLocations = [...locations, { id: crypto.randomUUID(), name, detail }];
    setLocations(nextLocations);
    savePreferences(nextLocations, selectedOptions);
    event.currentTarget.reset();
  }

  function removeLocation(id: string) {
    const nextLocations = locations.filter((location) => location.id !== id);
    setLocations(nextLocations);
    savePreferences(nextLocations, selectedOptions);
  }

  function toggleOption(id: TradeOptionId) {
    const nextOptions = selectedOptions.includes(id) ? selectedOptions.filter((option) => option !== id) : [...selectedOptions, id];
    setSelectedOptions(nextOptions);
    savePreferences(locations, nextOptions);
  }

  function startAutoScroll() {
    const list = listRef.current;
    if (!list || list.scrollWidth <= list.clientWidth || scrollFrameRef.current !== null) return;
    initialScrollRef.current = list.scrollLeft;

    const scroll = () => {
      const maxScroll = list.scrollWidth - list.clientWidth;
      if (list.scrollLeft >= maxScroll) {
        list.scrollLeft = maxScroll;
        scrollFrameRef.current = null;
        return;
      }
      list.scrollLeft += 0.6;
      scrollFrameRef.current = requestAnimationFrame(scroll);
    };
    scrollFrameRef.current = requestAnimationFrame(scroll);
  }

  function stopAutoScroll() {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = null;
    listRef.current?.scrollTo({ left: initialScrollRef.current, behavior: "smooth" });
  }

  const isOwner = sessionUser?.username === normalizedUsername;
  const visibleOptions = isOwner && isEditing ? tradeOptions : tradeOptions.filter((option) => selectedOptions.includes(option.id));

  if (!ready) {
    return (
      <section aria-busy="true" aria-label="Đang tải phương thức giao dịch">
        <div className="mb-3 h-6 w-48 animate-pulse rounded-sm bg-secondary motion-reduce:animate-none" />
        <div className="h-11 animate-pulse rounded-sm border bg-card/75 motion-reduce:animate-none" />
      </section>
    );
  }

  return (
    <section className="flex flex-col" aria-labelledby="trading-locations-title">
      <div className="mb-3">
        <h2 id="trading-locations-title" className="flex items-center gap-2 font-serif text-lg font-semibold text-[#5f793f]">
          <MapPin className="size-4" />
          Phương thức giao dịch
        </h2>
      </div>

      <div className="relative flex min-w-0 items-center gap-2 overflow-hidden rounded-sm border bg-card/75 px-3 py-2">
        {locations.length > 0 || visibleOptions.length > 0 ? (
          <ul ref={listRef} onMouseEnter={startAutoScroll} onMouseLeave={stopAutoScroll} className={cn("flex min-w-0 flex-1 flex-nowrap gap-1.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", isOwner && "pr-10")}>
            {locations.map((location) => (
              <li key={location.id} title={location.detail} className="relative flex h-7 shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-sm border bg-secondary py-0 pr-7 pl-2.5 text-[9px]">
                <strong>{location.name}</strong>
                {location.detail && <span className="whitespace-nowrap text-muted-foreground">· {location.detail}</span>}
                {isOwner && isEditing && (
                  <button type="button" onClick={() => removeLocation(location.id)} className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-destructive" aria-label={`Xóa ${location.name}`}>
                    <Trash2 className="size-3" />
                  </button>
                )}
              </li>
            ))}
            {visibleOptions.map((option) => {
              const checked = selectedOptions.includes(option.id);
              return (
                <li key={option.id}>
                  <label className={cn("flex h-7 shrink-0 items-center gap-1.5 rounded-sm border bg-secondary px-2.5 text-[9px] font-bold", isOwner && isEditing && "cursor-pointer hover:border-[#8ba55e]", !checked && "text-muted-foreground opacity-65")}>
                    {isOwner && isEditing ? (
                      <input type="checkbox" checked={checked} onChange={() => toggleOption(option.id)} className="size-3 accent-[#607d35]" />
                    ) : <Check className="size-3 text-[#607d35]" />}
                    {option.label}
                  </label>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-[9px] text-muted-foreground">Chưa có điểm hẹn trực tiếp.</p>}
        {isOwner && (
          <Button variant="outline" size="icon" className="absolute top-1/2 right-2 size-7 -translate-y-1/2 bg-card" onClick={() => setIsEditing((editing) => !editing)} aria-label={isEditing ? "Hoàn tất thiết lập" : "Thiết lập phương thức giao dịch"} title={isEditing ? "Xong" : "Thiết lập"}>
            {isEditing ? <X className="size-3" /> : <Pencil className="size-3" />}
          </Button>
        )}
      </div>

      {isOwner && isEditing && (
        <form onSubmit={addLocation} className="mt-2 grid grid-cols-[minmax(90px,1fr)_minmax(110px,1.5fr)_32px] gap-1.5 rounded-sm border border-dashed bg-secondary/45 p-2">
          <Input name="name" required className="h-8 px-2 text-[10px]" placeholder="Tên điểm hẹn" aria-label="Tên địa điểm" />
          <Input name="detail" className="h-8 px-2 text-[10px]" placeholder="Thời gian/ghi chú (tùy chọn)" aria-label="Thời gian hoặc ghi chú" />
          <Button type="submit" size="icon" className="size-8" aria-label="Thêm điểm hẹn" title="Thêm điểm hẹn"><Plus className="size-3.5" /></Button>
        </form>
      )}
    </section>
  );
}
