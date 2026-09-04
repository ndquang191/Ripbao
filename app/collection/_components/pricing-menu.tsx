"use client";

import { useEffect, useId } from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  announceDropdownOpen,
  DROPDOWN_OPEN_EVENT,
} from "@/lib/dropdown-coordination";
import { cn } from "@/lib/utils";
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
  useEffect(() => {
    const closeForOtherDropdown = (event: Event) => {
      if (!(event instanceof CustomEvent) || event.detail !== dropdownId)
        props.setOpen(false);
    };
    document.addEventListener(DROPDOWN_OPEN_EVENT, closeForOtherDropdown);
    return () =>
      document.removeEventListener(DROPDOWN_OPEN_EVENT, closeForOtherDropdown);
  }, [dropdownId, props.setOpen]);
  useEffect(() => {
    if (props.open) announceDropdownOpen(dropdownId);
  }, [dropdownId, props.open]);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => props.setOpen(!props.open)}
      >
        <SlidersHorizontal className="size-3.5" /> Thiết lập giá{" "}
        <ChevronDown className={cn("size-3", props.open && "rotate-180")} />
      </Button>
      {props.open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,420px)] rounded-sm border bg-card p-3 shadow-xl">
          <strong className="text-xs">Thiết lập giá nhanh</strong>
          <div className="mt-3 grid grid-cols-[1fr_120px_90px] items-center gap-2">
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
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <span className="text-[9px] text-muted-foreground">
              {props.count} loại sẽ cập nhật
            </span>
            <Button size="sm" disabled={!props.count} onClick={props.apply}>
              <Check className="size-3" /> Áp dụng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
