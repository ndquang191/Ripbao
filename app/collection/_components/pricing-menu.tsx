"use client";

import { useId, useRef } from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCoordinatedDropdown } from "@/lib/use-coordinated-dropdown";
import { defaultMin, defaultMultiplier } from "../_lib/collection-utils";
import { QUICK_PRICING_RARITY_COLORS } from "../_lib/constants";
import { MoneyInput, MultiplierInput } from "./editor-inputs";

export function PricingMenu(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  rarities: string[];
  minimums: Record<string, number>;
  multipliers: Record<string, number>;
  setMinimum: (rarity: string, value: number) => void;
  setMultiplier: (rarity: string, value: number) => void;
  count: number;
  apply: () => void;
}) {
  const dropdownId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  useCoordinatedDropdown(props.open, dropdownId, rootRef, () =>
    props.setOpen(false),
  );

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        className="min-h-11 w-full text-sm sm:min-h-0 sm:w-auto sm:text-xs"
        onClick={() => props.setOpen(!props.open)}
        aria-expanded={props.open}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal className="size-3.5" /> Thiết lập giá{" "}
        <ChevronDown className={cn("size-3", props.open && "rotate-180")} />
      </Button>
      {props.open && (
        <div
          className="fixed inset-x-4 top-24 z-40 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-md border bg-card p-4 shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:max-h-none sm:w-[min(92vw,420px)] sm:overflow-visible sm:rounded-sm sm:p-3"
          role="dialog"
          aria-label="Thiết lập giá nhanh"
        >
          <strong className="text-base sm:text-xs">Thiết lập giá nhanh</strong>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(96px,120px)_72px] items-center gap-2 max-sm:[&_input]:h-11 max-sm:[&_input]:text-sm sm:grid-cols-[1fr_120px_90px]">
            <span className="text-[9px] font-bold text-muted-foreground">
              Độ hiếm
            </span>
            <span className="text-[9px] font-bold text-muted-foreground">
              Giá tối thiểu
            </span>
            <span className="text-[9px] font-bold text-muted-foreground">
              Hệ số TCG
            </span>
            {props.rarities.map((rarity) => (
              <div key={rarity} className="contents">
                <span className="flex min-w-0 items-center gap-2 text-[10px] font-bold">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-[2px] border border-black/15"
                    style={{
                      backgroundColor: QUICK_PRICING_RARITY_COLORS[rarity],
                    }}
                  />
                  {rarity}
                </span>
                <MoneyInput
                  value={props.minimums[rarity] ?? defaultMin(rarity)}
                  set={(value) => props.setMinimum(rarity, value)}
                />
                <MultiplierInput
                  value={props.multipliers[rarity] ?? defaultMultiplier(rarity)}
                  set={(value) => props.setMultiplier(rarity, value)}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 sm:mt-3">
            <span className="text-xs text-muted-foreground sm:text-[9px]">
              {props.count} loại sẽ cập nhật
            </span>
            <Button
              size="sm"
              className="min-h-11 text-sm sm:min-h-0 sm:text-xs"
              disabled={!props.count}
              onClick={props.apply}
            >
              <Check className="size-3" /> Áp dụng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
