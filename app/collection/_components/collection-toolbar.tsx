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
  saveStatus: "idle" | "saved" | "error";
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
    <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex gap-3 items-center">
        <PageTitle icon={LibraryBig}>Bộ sưu tập của bạn</PageTitle>
        <p className="mt-2 text-xs text-muted-foreground">
          <strong className="text-foreground">{props.typeCount}</strong> loại ·{" "}
          <strong className="text-foreground">{props.copyCount}</strong> bản
          {props.dirty && (
            <span className="ml-2 text-[#966027]">• Có thay đổi chưa lưu</span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {props.username && (
          <Link
            href={`/u/${encodeURIComponent(props.username)}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Eye className="size-3.5" /> Xem trước
          </Link>
        )}
        <Button variant="outline" size="sm" onClick={props.openDrawer}>
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
          disabled={!props.dirty || props.saving}
          onClick={props.saveChanges}
        >
          {props.saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : props.saveStatus === "saved" ? (
            <Check className="size-3.5" />
          ) : (
            <Save className="size-3.5" />
          )}
          {props.saving
            ? "Đang lưu..."
            : props.saveStatus === "saved"
              ? "Đã lưu"
              : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
