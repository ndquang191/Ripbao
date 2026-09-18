"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Trash2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  domainColor,
  defaultMin,
  defaultMultiplier,
  editFor,
  finalPrice,
  defaultFinish,
  supportsDualFinish,
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
  const [expanded, setExpanded] = useState(true);
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
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2.5 text-left text-white sm:py-1.5",
          expanded ? "rounded-t-sm" : "rounded-sm",
        )}
        style={{ backgroundColor: color }}
        aria-expanded={expanded}
      >
        <h2 className="text-sm font-extrabold sm:text-xs">{props.domain}</h2>
        <span className="flex items-center gap-2 text-xs font-medium text-white/80 sm:text-[9px]">
          <span>{props.cards.length} loại · {copies} bản</span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200 sm:size-3.5",
              expanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </span>
      </button>
      {expanded && (
        <>
          <div className="hidden gap-4 border-b bg-secondary/45 px-3 py-2 text-[9px] font-bold uppercase text-muted-foreground md:grid md:grid-cols-[72px_minmax(160px,1fr)_90px_430px] xl:grid-cols-[72px_minmax(180px,320px)_160px_minmax(600px,1fr)]">
            <span>Ảnh</span>
            <SortButton
              label="Tên card"
              sortKey="name"
              sort={props.sort}
              changeSort={props.changeSort}
            />
            <span>Set / Mã</span>
            <div className="grid grid-cols-[48px_72px_minmax(80px,104px)_52px_minmax(60px,74px)] gap-2 px-2 xl:grid-cols-[70px_90px_minmax(130px,1fr)_70px_minmax(90px,1fr)] xl:gap-7">
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
        </>
      )}
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
  const nonfoil = editFor(props.draft, card.id, "nonfoil");
  const foil = editFor(props.draft, card.id, "foil");
  const canHaveBoth = supportsDualFinish(card.rarity);
  const bothHaveQuantity = canHaveBoth && nonfoil.quantity > 0 && foil.quantity > 0;
  const [showBoth, setShowBoth] = useState(bothHaveQuantity);
  const [removedEdits, setRemovedEdits] = useState<{
    nonfoil: Edit;
    foil: Edit;
    showBoth: boolean;
  } | null>(null);
  const [singleFinish, setSingleFinish] = useState<Finish>(() =>
    canHaveBoth
      ? foil.quantity > 0 && nonfoil.quantity <= 0 ? "foil" : "nonfoil"
      : defaultFinish(card.rarity),
  );
  useEffect(() => {
    if (bothHaveQuantity) setShowBoth(true);
    if (!showBoth) {
      if (foil.quantity > 0) setSingleFinish("foil");
      else if (nonfoil.quantity > 0) setSingleFinish("nonfoil");
    }
  }, [bothHaveQuantity, foil.quantity, nonfoil.quantity, showBoth]);
  const quantity = nonfoil.quantity + foil.quantity;
  const removeCard = () => {
    setRemovedEdits({ nonfoil, foil, showBoth });
    setShowBoth(false);
    props.updateCard(card.id, "nonfoil", { quantity: 0 });
    props.updateCard(card.id, "foil", { quantity: 0 });
  };
  const undoRemove = () => {
    const restoredNonfoil = removedEdits?.nonfoil ?? editFor(props.saved, card.id, "nonfoil");
    const restoredFoil = removedEdits?.foil ?? editFor(props.saved, card.id, "foil");
    props.updateCard(card.id, "nonfoil", restoredNonfoil);
    props.updateCard(card.id, "foil", restoredFoil);
    setShowBoth(removedEdits?.showBoth ?? (restoredNonfoil.quantity > 0 && restoredFoil.quantity > 0));
    setSingleFinish(restoredFoil.quantity > 0 && restoredNonfoil.quantity <= 0 ? "foil" : "nonfoil");
    setRemovedEdits(null);
  };
  const canUndoRemove = !quantity && Boolean(
    removedEdits ||
      props.saved[variantKey(card.id, "nonfoil")] ||
      props.saved[variantKey(card.id, "foil")],
  );
  const setBoth = (enabled: boolean) => {
    if (!enabled) {
      const keep: Finish = nonfoil.quantity > 0
        ? "nonfoil"
        : foil.quantity > 0
          ? "foil"
          : singleFinish;
      const remove: Finish = keep === "foil" ? "nonfoil" : "foil";
      setSingleFinish(keep);
      setShowBoth(false);
      props.updateCard(card.id, remove, { quantity: 0 });
      return;
    }
    setShowBoth(true);
    const other: Finish = singleFinish === "foil" ? "nonfoil" : "foil";
    if (editFor(props.draft, card.id, singleFinish).quantity <= 0) {
      const primary = editFor(props.draft, card.id, singleFinish);
      props.updateCard(card.id, singleFinish, {
        quantity: 1,
        minPrice: props.draft[variantKey(card.id, singleFinish)]
          ? primary.minPrice
          : defaultMin(card.rarity),
        tcgMultiplier: props.draft[variantKey(card.id, singleFinish)]
          ? primary.tcgMultiplier
          : defaultMultiplier(card.rarity),
      });
    }
    const otherEdit = editFor(props.draft, card.id, other);
    props.updateCard(card.id, other, {
      quantity: Math.max(1, otherEdit.quantity),
      minPrice: props.draft[variantKey(card.id, other)]
        ? otherEdit.minPrice
        : defaultMin(card.rarity),
      tcgMultiplier: props.draft[variantKey(card.id, other)]
        ? otherEdit.tcgMultiplier
        : defaultMultiplier(card.rarity),
    });
  };
  return (
    <div
      className={cn(
        "grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-3 border-t px-3 py-3 first:border-t-0 md:h-[112px] md:grid-cols-[72px_minmax(160px,1fr)_90px_430px] md:gap-4 md:px-3 md:py-2 xl:grid-cols-[72px_minmax(180px,320px)_160px_minmax(600px,1fr)]",
        !quantity && "bg-destructive/5",
      )}
    >
      <CardImage
        card={card}
        className="h-[116px] w-[88px] self-stretch border-0 bg-transparent md:h-full md:min-h-0 md:w-[68px]"
        imageClassName="object-contain"
      />
      <div className="min-w-0 self-center">
          <div className="flex items-center justify-between gap-2">
            <strong className="min-w-0 flex-1 text-sm leading-4 font-bold md:truncate md:text-xs">
              {card.name}
            </strong>
            {(quantity > 0 || canUndoRemove) && (
              <button
                type="button"
                onClick={quantity > 0 ? removeCard : undoRemove}
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-sm md:hidden",
                  quantity > 0
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-[#506b32] hover:bg-[#edf3e5]",
                )}
                aria-label={quantity > 0 ? `Xóa ${card.name} khỏi collection` : `Hoàn tác xóa ${card.name}`}
                title={quantity > 0 ? "Xóa card" : "Hoàn tác xóa"}
              >
                {quantity > 0 ? <Trash2 className="size-3" /> : <Undo2 className="size-3" />}
              </button>
            )}
          </div>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground md:hidden">
            {card.set} · #{card.collectorNumber} · {card.rarity}
          </p>
          {canHaveBoth && quantity > 0 && <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-sm bg-secondary/70 px-2 py-1 text-[9px] font-bold">
                <input
                  type="checkbox"
                  checked={showBoth}
                  onChange={(event) => setBoth(event.target.checked)}
                  className="size-3.5 accent-primary"
                />
                Có cả Foil &amp; Thường
              </label>
          </div>}
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
      <div className="hidden min-w-0 items-center justify-between gap-1 self-center text-[10px] md:flex">
        <span className="min-w-0 truncate">
          <strong>{card.set}</strong>{" "}
          <span className="text-muted-foreground">#{card.collectorNumber}</span>
        </span>
        {(quantity > 0 || canUndoRemove) && (
          <button
            type="button"
            onClick={quantity > 0 ? removeCard : undoRemove}
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-sm",
              quantity > 0
                ? "text-destructive hover:bg-destructive/10"
                : "text-[#506b32] hover:bg-[#edf3e5]",
            )}
            aria-label={quantity > 0 ? `Xóa ${card.name} khỏi collection` : `Hoàn tác xóa ${card.name}`}
            title={quantity > 0 ? "Xóa card" : "Hoàn tác xóa"}
          >
            {quantity > 0 ? <Trash2 className="size-3" /> : <Undo2 className="size-3" />}
          </button>
        )}
      </div>
      <div className="col-span-2 grid grid-rows-2 gap-2 self-center md:col-span-1 md:col-start-auto md:gap-1">
        {showBoth ? (
          <>
            <VariantRow card={card} finish="nonfoil" edit={nonfoil} showFinish minimumQuantity={foil.quantity > 0 ? 0 : 1} updateCard={props.updateCard} />
            <VariantRow card={card} finish="foil" edit={foil} showFinish minimumQuantity={nonfoil.quantity > 0 ? 0 : 1} updateCard={props.updateCard} />
          </>
        ) : nonfoil.quantity > 0 ? (
          <div className="row-span-2 self-center">
            <VariantRow card={card} finish="nonfoil" edit={nonfoil} showFinish updateCard={props.updateCard} />
          </div>
        ) : foil.quantity > 0 ? (
          <div className="row-span-2 self-center">
            <VariantRow card={card} finish="foil" edit={foil} showFinish updateCard={props.updateCard} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VariantRow(props: {
  card: CardData;
  finish: Finish;
  edit: Edit;
  showFinish: boolean;
  minimumQuantity?: number;
  updateCard: (id: string, finish: Finish, edit: Partial<Edit>) => void;
}) {
  const label = props.finish === "foil" ? "Foil" : "Thường";
  const set = (patch: Partial<Edit>) =>
    props.updateCard(props.card.id, props.finish, patch);
  const finishClassName = cn(
    "text-[10px] font-extrabold",
    props.finish === "foil" && "text-[#826a19]",
  );

  return (
    <>
      <div className="rounded-md border bg-background/70 px-2 py-2 shadow-xs md:hidden">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className={cn(finishClassName, "rounded-sm bg-secondary px-1.5 py-0.5")}>
            {props.showFinish ? label : null}
          </span>
          <div className="flex min-w-0 items-baseline gap-1.5 text-right">
            <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
              Giá cuối
            </span>
            <strong className="truncate text-[11px] text-[#506b32]">
              {finalPrice(props.card, props.finish, props.edit)}
            </strong>
          </div>
        </div>
        <div className="mt-1.5 grid grid-cols-[80px_minmax(100px,1fr)_56px] items-end gap-2">
          <label className="min-w-0 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
            <span>Số lượng</span>
            <QuantityInput
              value={props.edit.quantity}
              name={`${props.card.name} ${label}`}
              min={props.minimumQuantity}
              set={(quantity) => set({ quantity })}
            />
          </label>
          <label className="min-w-0 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
            <span>Giá Min</span>
            <MoneyInput value={props.edit.minPrice} set={(minPrice) => set({ minPrice })} />
          </label>
          <label className="min-w-0 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
            <span>× TCG</span>
            <MultiplierInput
              value={props.edit.tcgMultiplier}
              set={(tcgMultiplier) => set({ tcgMultiplier })}
              className="mt-1 px-1"
            />
          </label>
        </div>
      </div>

      <div className="hidden min-h-9 grid-cols-[48px_72px_minmax(80px,104px)_52px_minmax(60px,74px)] items-center gap-2 rounded-sm border bg-background/60 px-3 py-1 md:grid xl:grid-cols-[70px_90px_minmax(130px,1fr)_70px_minmax(90px,1fr)] xl:gap-7 xl:px-4">
        <span className={finishClassName}>{props.showFinish ? label : null}</span>
        <label className="text-[9px] font-bold text-muted-foreground">
          <QuantityInput
            value={props.edit.quantity}
            name={`${props.card.name} ${label}`}
            min={props.minimumQuantity}
            set={(quantity) => set({ quantity })}
          />
        </label>
        <label className="text-[9px] font-bold text-muted-foreground">
          <MoneyInput value={props.edit.minPrice} set={(minPrice) => set({ minPrice })} />
        </label>
        <label className="text-[9px] font-bold text-muted-foreground">
          <MultiplierInput value={props.edit.tcgMultiplier} set={(tcgMultiplier) => set({ tcgMultiplier })} />
        </label>
        <div className="text-right">
          <strong className="text-[10px] text-[#506b32]">{finalPrice(props.card, props.finish, props.edit)}</strong>
        </div>
      </div>
    </>
  );
}
