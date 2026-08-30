"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { sessionKey } from "@/components/account-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TradingLocation = { id: string; name: string; detail: string };
type TradeOptionId = "nexus-night" | "skirmish" | "ship-inner-city" | "ship-nationwide";
type LegacyLocation = TradingLocation & { kind?: "meetup" | "event" };

const sampleLocations: TradingLocation[] = [
  { id: "district-1", name: "Quận 1", detail: "TP.HCM · Hẹn địa chỉ cụ thể qua tin nhắn" },
  { id: "district-3", name: "Quận 3", detail: "TP.HCM · Sau 18:00 các ngày trong tuần" },
  { id: "thu-duc", name: "Thủ Đức", detail: "TP.HCM · Cuối tuần" },
];

const tradeOptions: Array<{ id: TradeOptionId; label: string }> = [
  { id: "nexus-night", label: "Nexus Night" },
  { id: "skirmish", label: "Skirmish" },
  { id: "ship-inner-city", label: "Ship nội thành" },
  { id: "ship-nationwide", label: "Ship toàn quốc" },
];

const defaultOptions: TradeOptionId[] = ["nexus-night", "skirmish", "ship-inner-city"];
const validOptionIds = new Set(tradeOptions.map((option) => option.id));

export function TradingLocations({ username, forceViewer = false }: { username: string; forceViewer?: boolean }) {
  const normalizedUsername = username.toLocaleLowerCase();
  const locationsStorageKey = `ripbao.locations.${normalizedUsername}`;
  const optionsStorageKey = `ripbao.trade-options.${normalizedUsername}`;
  const [locations, setLocations] = useState<TradingLocation[]>(sampleLocations);
  const [selectedOptions, setSelectedOptions] = useState<TradeOptionId[]>(defaultOptions);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const initialScrollRef = useRef(0);

  useEffect(() => {
    const signedInAs = window.localStorage.getItem(sessionKey);
    setIsOwner(!forceViewer && signedInAs?.toLocaleLowerCase() === normalizedUsername);

    const savedLocations = window.localStorage.getItem(locationsStorageKey);
    if (savedLocations) {
      try {
        const parsedLocations = JSON.parse(savedLocations) as LegacyLocation[];
        setLocations(parsedLocations.filter((location) => location.kind !== "event").map(({ id, name, detail }) => ({ id, name, detail })));
      } catch {
        window.localStorage.removeItem(locationsStorageKey);
      }
    }

    const savedOptions = window.localStorage.getItem(optionsStorageKey);
    if (savedOptions) {
      try {
        const parsedOptions = JSON.parse(savedOptions) as string[];
        const migratedOptions = parsedOptions.map((option) => {
          if (option === "inner-city") return "ship-inner-city";
          if (option === "nationwide") return "ship-nationwide";
          return option;
        }).filter((option): option is TradeOptionId => validOptionIds.has(option as TradeOptionId));
        setSelectedOptions([...new Set(migratedOptions)]);
      } catch {
        window.localStorage.removeItem(optionsStorageKey);
      }
    }
  }, [forceViewer, locationsStorageKey, normalizedUsername, optionsStorageKey]);

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  function addLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const detail = String(form.get("detail") ?? "").trim();
    if (!name) return;

    const nextLocations = [...locations, { id: crypto.randomUUID(), name, detail }];
    setLocations(nextLocations);
    window.localStorage.setItem(locationsStorageKey, JSON.stringify(nextLocations));
    event.currentTarget.reset();
  }

  function removeLocation(id: string) {
    const nextLocations = locations.filter((location) => location.id !== id);
    setLocations(nextLocations);
    window.localStorage.setItem(locationsStorageKey, JSON.stringify(nextLocations));
  }

  function toggleOption(id: TradeOptionId) {
    const nextOptions = selectedOptions.includes(id) ? selectedOptions.filter((option) => option !== id) : [...selectedOptions, id];
    setSelectedOptions(nextOptions);
    window.localStorage.setItem(optionsStorageKey, JSON.stringify(nextOptions));
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

  const visibleOptions = isOwner && isEditing ? tradeOptions : tradeOptions.filter((option) => selectedOptions.includes(option.id));

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
