"use client";

import Link from "next/link";
import { Check, Eye, LibraryBig, Loader2, Plus, Save } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { Button, buttonVariants } from "@/components/ui/button";
import { QUICK_PRICING_RARITIES } from "../_lib/constants";
import { PricingMenu } from "./pricing-menu";

export function CollectionToolbar(props: {
  username: string;
  typeCount: number;
  copyCount: number;
  dirty: boolean;
  saving: boolean;
  priceLookupPending: boolean;
  saveStatus: "idle" | "saved" | "price-warning" | "error";
  pricingOpen: boolean;
  setPricingOpen: (open: boolean) => void;
  minimums: Record<string, number>;
  multipliers: Record<string, number>;
  setMinimum: (rarity: string, value: number) => void;
  setMultiplier: (rarity: string, value: number) => void;
  pricingCount: number;
  openDrawer: () => void;
  applyBulkPricing: () => void;
  saveChanges: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-4 sm:py-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <PageTitle icon={LibraryBig}>Bộ sưu tập của bạn</PageTitle>
        <p className="text-sm text-muted-foreground sm:mt-2 sm:text-xs">
          <strong className="text-foreground">{props.typeCount}</strong> loại ·{" "}
          <strong className="text-foreground">{props.copyCount}</strong> bản
          {props.dirty && (
            <span className="block text-[#966027] sm:ml-2 sm:inline">
              • Có thay đổi chưa lưu
            </span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {props.username && (
          <Link
            href={`/u/${encodeURIComponent(props.username)}`}
            className={`${buttonVariants({ variant: "outline", size: "sm" })} min-h-11 text-sm sm:min-h-0 sm:text-xs`}
          >
            <Eye className="size-3.5" /> Xem trước
          </Link>
        )}
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 text-sm sm:min-h-0 sm:text-xs"
          onClick={props.openDrawer}
        >
          <Plus className="size-3.5" /> Thêm card
        </Button>
        <PricingMenu
          open={props.pricingOpen}
          setOpen={props.setPricingOpen}
          rarities={QUICK_PRICING_RARITIES}
          minimums={props.minimums}
          multipliers={props.multipliers}
          setMinimum={props.setMinimum}
          setMultiplier={props.setMultiplier}
          count={props.pricingCount}
          apply={props.applyBulkPricing}
        />
        <Button
          size="sm"
          className="col-span-2 min-h-11 text-sm sm:col-span-1 sm:min-h-0 sm:text-xs"
          disabled={!props.dirty || props.saving || props.priceLookupPending}
          onClick={props.saveChanges}
        >
          {props.saving || props.priceLookupPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : props.saveStatus === "saved" || props.saveStatus === "price-warning" ? (
            <Check className="size-3.5" />
          ) : (
            <Save className="size-3.5" />
          )}
          {props.priceLookupPending
            ? "Đang lấy giá..."
            : props.saving
            ? "Đang lưu..."
            : props.saveStatus === "saved" || props.saveStatus === "price-warning"
              ? "Đã lưu"
              : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
