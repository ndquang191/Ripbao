"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { domainColor, editOf, finalPrice } from "../_lib/collection-utils";
import { type CardData, type Edit, type Sort } from "../_lib/models";
import {
  CardImage,
  MoneyInput,
  MultiplierInput,
  QuantityInput,
} from "./editor-inputs";

export function DomainSection(props: {
  domain: string;
  cards: CardData[];
  draft: Record<string, Edit>;
  saved: Record<string, Edit>;
  sort: Sort;
  changeSort: (key: Sort["key"]) => void;
  updateCard: (id: string, edit: Partial<Edit>) => void;
}) {
  const copies = props.cards.reduce(
    (total, card) => total + Math.max(0, props.draft[card.id]?.quantity ?? 0),
    0,
  );
  const color = domainColor(props.domain);
  return (
    <section
      className="overflow-hidden rounded-sm border bg-card shadow-sm"
      style={{ borderColor: color }}
    >
      <header
        className="flex items-center justify-between px-3 py-1.5 text-white"
        style={{ backgroundColor: color }}
      >
        <h2 className="text-xs font-extrabold">{props.domain}</h2>
        <span className="text-[9px] font-medium text-white/80">
          {props.cards.length} loại · {copies} bản
        </span>
      </header>
      <div className="hidden grid-cols-[52px_minmax(170px,1fr)_130px_112px_132px_92px_120px] gap-2 border-b bg-secondary/45 px-3 py-2 text-[9px] font-bold uppercase text-muted-foreground md:grid">
        <span>Ảnh</span>
        <SortButton
          label="Tên card"
          sortKey="name"
          sort={props.sort}
          changeSort={props.changeSort}
        />
        <span>Set / Mã</span>
        <SortButton
          label="Số lượng"
          sortKey="quantity"
          sort={props.sort}
          changeSort={props.changeSort}
        />
        <span>Giá Min</span>
        <span>× TCG</span>
        <SortButton
          label="Giá cuối"
          sortKey="finalPrice"
          sort={props.sort}
          changeSort={props.changeSort}
          className="justify-end border-l pl-3 text-right"
        />
      </div>
      {props.cards.map((card) => (
        <CardRow
          key={card.id}
          card={card}
          edit={editOf(props.draft[card.id])}
          wasSaved={Boolean(props.saved[card.id])}
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
  edit: Edit;
  wasSaved: boolean;
  updateCard: (id: string, edit: Partial<Edit>) => void;
}) {
  const { card, edit } = props;
  return (
    <div
      className={cn(
        "grid gap-3 border-t p-3 first:border-t-0 md:grid-cols-[52px_minmax(170px,1fr)_130px_112px_132px_92px_120px] md:items-center md:gap-2",
        !edit.quantity && "bg-destructive/5",
      )}
    >
      <div className="flex gap-3 md:contents">
        <CardImage card={card} />
        <div className="min-w-0 flex-1 self-center">
          <strong className="block truncate text-xs">{card.name}</strong>
          <p className="mt-1 text-[9px] text-muted-foreground md:hidden">
            {card.set} · #{card.collectorNumber} · {card.rarity}
          </p>
          {!edit.quantity && (
            <span className="mt-1 inline-block rounded-sm bg-destructive/10 px-1.5 py-.5 text-[9px] font-bold text-destructive">
              {props.wasSaved ? "Sẽ xóa khi lưu" : "Chưa thêm"}
            </span>
          )}
        </div>
      </div>
      <div className="hidden text-[10px] md:block">
        <strong>{card.set}</strong>{" "}
        <span className="text-muted-foreground">#{card.collectorNumber}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 md:contents">
        <label className="text-[9px] font-bold text-muted-foreground md:hidden">
          Số lượng
          <QuantityInput
            value={edit.quantity}
            name={card.name}
            set={(quantity) => props.updateCard(card.id, { quantity })}
          />
        </label>
        <div className="hidden md:block">
          <QuantityInput
            value={edit.quantity}
            name={card.name}
            set={(quantity) => props.updateCard(card.id, { quantity })}
          />
        </div>
        <label className="text-[9px] font-bold text-muted-foreground">
          <span className="md:hidden">Giá Min</span>
          <MoneyInput
            value={edit.minPrice}
            set={(minPrice) => props.updateCard(card.id, { minPrice })}
          />
        </label>
        <label className="text-[9px] font-bold text-muted-foreground">
          <span className="md:hidden">× TCG</span>
          <MultiplierInput
            value={edit.tcgMultiplier}
            set={(tcgMultiplier) =>
              props.updateCard(card.id, { tcgMultiplier })
            }
            className="mt-1 md:mt-0"
          />
        </label>
      </div>
      <div className="text-right md:border-l md:pl-3">
        <span className="text-[9px] font-bold text-muted-foreground md:hidden">
          Giá cuối{" "}
        </span>
        <strong className="text-[10px] text-[#506b32]">
          {finalPrice(card, edit)}
        </strong>
      </div>
    </div>
  );
}
