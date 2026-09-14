"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  domainColor,
  editFor,
  finalPrice,
  totalQuantity,
  variantKey,
} from "../_lib/collection-utils";
import {
  type CardData,
  type CollectionDraft,
  type Edit,
  type Finish,
  type Sort,
} from "../_lib/models";
import {
  CardImage,
  MoneyInput,
  MultiplierInput,
  QuantityInput,
} from "./editor-inputs";

export function DomainSection(props: {
  domain: string;
  cards: CardData[];
  draft: CollectionDraft;
  saved: CollectionDraft;
  sort: Sort;
  changeSort: (key: Sort["key"]) => void;
  updateCard: (id: string, finish: Finish, edit: Partial<Edit>) => void;
}) {
  const copies = props.cards.reduce(
    (total, card) => total + totalQuantity(props.draft, card.id),
    0,
  );
  const color = domainColor(props.domain);
  return (
    <section
      className="rounded-sm border bg-card shadow-sm"
      style={{ borderColor: color }}
    >
      <header
        className="flex items-center justify-between rounded-t-sm px-3 py-2.5 text-white sm:py-1.5"
        style={{ backgroundColor: color }}
      >
        <h2 className="text-sm font-extrabold sm:text-xs">{props.domain}</h2>
        <span className="text-xs font-medium text-white/80 sm:text-[9px]">
          {props.cards.length} loại · {copies} bản
        </span>
      </header>
      <div className="hidden grid-cols-[52px_minmax(170px,1fr)_130px_minmax(0,456px)] gap-2 border-b bg-secondary/45 px-3 py-2 text-[9px] font-bold uppercase text-muted-foreground md:grid">
        <span>Ảnh</span>
        <SortButton
          label="Tên card"
          sortKey="name"
          sort={props.sort}
          changeSort={props.changeSort}
        />
        <span>Set / Mã</span>
        <div className="grid grid-cols-[64px_minmax(92px,112px)_minmax(100px,132px)_72px_minmax(76px,100px)] gap-2 px-2">
          <span>Phiên bản</span>
          <SortButton label="Số lượng" sortKey="quantity" sort={props.sort} changeSort={props.changeSort} />
          <span>Giá Min</span>
          <span>× TCG</span>
          <SortButton label="Giá cuối" sortKey="finalPrice" sort={props.sort} changeSort={props.changeSort} className="justify-end text-right" />
        </div>
      </div>
      {props.cards.map((card) => (
        <CardRow
          key={card.id}
          card={card}
          draft={props.draft}
          saved={props.saved}
          updateCard={props.updateCard}
        />
      ))}
    </section>
  );
}

function SortButton(props: {
  label: string;
  sortKey: Sort["key"];
  sort: Sort;
  changeSort: (key: Sort["key"]) => void;
  className?: string;
}) {
  const active = props.sort.key === props.sortKey;
  const Icon = active
    ? props.sort.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => props.changeSort(props.sortKey)}
      className={cn(
        "flex items-center gap-1 text-left uppercase hover:text-foreground",
        active && "text-foreground",
        props.className,
      )}
    >
      {props.label}
      <Icon
        className={cn("size-3", !active && "opacity-55")}
        aria-hidden="true"
      />
    </button>
  );
}

function CardRow(props: {
  card: CardData;
  draft: CollectionDraft;
  saved: CollectionDraft;
  updateCard: (id: string, finish: Finish, edit: Partial<Edit>) => void;
}) {
  const { card } = props;
  const quantity = totalQuantity(props.draft, card.id);
  return (
    <div
      className={cn(
        "grid gap-4 border-t p-3 first:border-t-0 md:grid-cols-[52px_minmax(170px,1fr)_130px_minmax(0,456px)] md:items-start md:gap-2",
        !quantity && "bg-destructive/5",
      )}
    >
      <div className="flex gap-3 md:contents">
        <CardImage card={card} />
        <div className="min-w-0 flex-1 self-center">
          <strong className="block text-base leading-5 font-bold md:truncate md:text-xs md:leading-4">
            {card.name}
          </strong>
          <p className="mt-1 text-xs text-muted-foreground md:hidden">
            {card.set} · #{card.collectorNumber} · {card.rarity}
          </p>
          <p className="mt-1 text-[10px] font-bold text-muted-foreground">
            Thường và Foil được quản lý riêng
          </p>
          {!quantity && (
            <span className="mt-1 inline-block rounded-sm bg-destructive/10 px-1.5 py-.5 text-[9px] font-bold text-destructive">
              {Boolean(
                props.saved[variantKey(card.id, "nonfoil")] ||
                  props.saved[variantKey(card.id, "foil")],
              )
                ? "Sẽ xóa khi lưu"
                : "Chưa thêm"}
            </span>
          )}
        </div>
      </div>
      <div className="hidden text-[10px] md:block">
        <strong>{card.set}</strong>{" "}
        <span className="text-muted-foreground">#{card.collectorNumber}</span>
      </div>
      <div className="space-y-2">
        <VariantRow card={card} finish="nonfoil" edit={editFor(props.draft, card.id, "nonfoil")} updateCard={props.updateCard} />
        <VariantRow card={card} finish="foil" edit={editFor(props.draft, card.id, "foil")} updateCard={props.updateCard} />
      </div>
    </div>
  );
}

function VariantRow(props: {
  card: CardData;
  finish: Finish;
  edit: Edit;
  updateCard: (id: string, finish: Finish, edit: Partial<Edit>) => void;
}) {
  const label = props.finish === "foil" ? "Foil" : "Thường";
  const set = (patch: Partial<Edit>) =>
    props.updateCard(props.card.id, props.finish, patch);

  return (
    <div className="grid grid-cols-[64px_minmax(92px,112px)_minmax(100px,132px)_72px_minmax(76px,100px)] items-center gap-2 rounded-sm border bg-background/60 p-2 max-md:grid-cols-2">
      <span className={cn("text-[10px] font-extrabold", props.finish === "foil" && "text-[#826a19]")}>
        {label}
      </span>
      <label className="text-[9px] font-bold text-muted-foreground max-md:text-xs">
        <span className="md:hidden">Số lượng</span>
        <QuantityInput value={props.edit.quantity} name={`${props.card.name} ${label}`} set={(quantity) => set({ quantity })} />
      </label>
      <label className="text-[9px] font-bold text-muted-foreground max-md:text-xs">
        <span className="md:hidden">Giá Min</span>
        <MoneyInput value={props.edit.minPrice} set={(minPrice) => set({ minPrice })} />
      </label>
      <label className="text-[9px] font-bold text-muted-foreground max-md:text-xs">
        <span className="md:hidden">× TCG</span>
        <MultiplierInput value={props.edit.tcgMultiplier} set={(tcgMultiplier) => set({ tcgMultiplier })} />
      </label>
      <div className="text-right max-md:self-end">
        <span className="block text-[9px] font-bold text-muted-foreground md:hidden">Giá cuối</span>
        <strong className="text-[10px] text-[#506b32]">{finalPrice(props.card, props.edit)}</strong>
      </div>
    </div>
  );
}
