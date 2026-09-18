"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Search, X } from "lucide-react";
import { CardImagePreview } from "@/components/card-image-preview";
import { FilterDropdown } from "@/components/domain-filter";
import { Input } from "@/components/ui/input";
import { currencyConfig, formatCurrencyInput } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { type CardData, type Finish } from "../_lib/models";

export function SearchBox({
  value,
  set,
  placeholder,
}: {
  value: string;
  set: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => set(event.target.value)}
        className="h-8 pl-8 pr-8 text-xs"
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={() => set("")}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          aria-label="Xóa tìm kiếm"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

export function QuantityInput({
  value,
  name,
  set,
  min = 0,
}: {
  value: number;
  name: string;
  set: (value: number) => void;
  min?: number;
}) {
  return (
    <div className="mt-1 flex w-fit items-center overflow-hidden rounded-sm border bg-background md:mt-0">
      <button
        className="grid size-6 place-items-center hover:bg-secondary disabled:opacity-30"
        disabled={value <= min}
        onClick={() => set(Math.max(min, value - 1))}
        aria-label={`Giảm số lượng ${name}`}
      >
        <Minus className="size-2.5" />
      </button>
      <input
        type="number"
        min={min}
        value={value}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => set(Math.max(min, event.target.valueAsNumber || 0))}
        className="h-6 w-8 border-x bg-background text-center text-[10px] font-black outline-none"
        aria-label={`Số lượng ${name}`}
      />
      <button
        className="grid size-6 place-items-center hover:bg-secondary"
        onClick={() => set(value + 1)}
        aria-label={`Tăng số lượng ${name}`}
      >
        <Plus className="size-2.5" />
      </button>
    </div>
  );
}

function useNumberInput(value: number, set: (value: number) => void) {
  const [inputValue, setInputValue] = useState(String(value));
  useEffect(() => setInputValue(String(value)), [value]);
  const commit = () => {
    const parsed = Number(inputValue);
    const next =
      inputValue === "" || !Number.isFinite(parsed) || parsed < 0 ? 0 : parsed;
    setInputValue(String(next));
    set(next);
  };
  const change = (next: string) => {
    setInputValue(next);
    const parsed = Number(next);
    if (next !== "" && Number.isFinite(parsed) && parsed >= 0) set(parsed);
  };
  return { inputValue, commit, change };
}

function useCurrencyInput(value: number, set: (value: number) => void) {
  const [inputValue, setInputValue] = useState(() =>
    formatCurrencyInput(value),
  );
  useEffect(() => setInputValue(formatCurrencyInput(value)), [value]);

  const change = (next: string) => {
    const digits = next.replace(/\D/g, "");
    if (!digits) {
      setInputValue("");
      return;
    }
    const parsed = Number(digits);
    setInputValue(formatCurrencyInput(parsed));
    set(parsed);
  };
  const commit = () => {
    if (inputValue) return;
    setInputValue(formatCurrencyInput(0));
    set(0);
  };

  return { inputValue, change, commit };
}

export function MoneyInput({
  value,
  set,
}: {
  value: number;
  set: (value: number) => void;
}) {
  const input = useCurrencyInput(value, set);
  return (
    <div className="relative mt-1 md:mt-0">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
        {currencyConfig.symbol}
      </span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9.]*"
        value={input.inputValue}
        onChange={(event) => input.change(event.target.value)}
        onBlur={input.commit}
        className="h-7 w-full rounded-sm border bg-background pl-6 pr-2 text-[10px] font-bold"
      />
    </div>
  );
}

export function MultiplierInput({
  value,
  set,
  className,
}: {
  value: number;
  set: (value: number) => void;
  className?: string;
}) {
  const input = useNumberInput(value, set);
  return (
    <input
      type="number"
      min="0"
      step=".5"
      value={input.inputValue}
      onChange={(event) => input.change(event.target.value)}
      onBlur={input.commit}
      className={cn(
        "h-7 w-full rounded-sm border bg-background px-2 text-center text-[10px] font-bold",
        className,
      )}
    />
  );
}

export function CardImage({
  card,
  className,
  imageClassName,
}: {
  card: CardData;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <CardImagePreview
      src={card.imageUrl}
      alt={card.name}
      className={cn("h-14 w-10", className)}
      imageClassName={imageClassName}
    />
  );
}

const FINISH_LABELS = ["Thường", "Foil"] as const;

export function FinishInput({ value, name, set }: {
  value: Finish;
  name: string;
  set: (value: Finish) => void;
}) {
  return (
    <div className="flex w-fit items-center gap-2 text-[10px] text-muted-foreground">
      <span>Loại</span>
      <FilterDropdown
        label="Foil"
        ariaLabel={`Loại foil của ${name}`}
        value={value === "foil" ? "Foil" : "Thường"}
        options={FINISH_LABELS}
        onChange={(finish) => set(finish === "Foil" ? "foil" : "nonfoil")}
        allowEmpty={false}
        className="[&>summary]:min-w-24"
      />
    </div>
  );
}
