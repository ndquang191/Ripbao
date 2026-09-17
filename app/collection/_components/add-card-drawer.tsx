"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { DomainFilter, FilterDropdown } from "@/components/domain-filter";
import { Button } from "@/components/ui/button";
import { useCardCatalog } from "../_hooks/use-card-catalog";
import { useModalDialog } from "../_hooks/use-modal-dialog";
import {
  defaultMin,
  defaultMultiplier,
  defaultFinish,
  domainColor,
  editFor,
  totalQuantity,
  supportsDualFinish,
  uniqueCards,
  variantKey,
} from "../_lib/collection-utils";
import {
  type CardData,
  type CollectionDraft,
  type Edit,
  type Finish,
} from "../_lib/models";
import {
  CardImage,
  QuantityInput,
  SearchBox,
} from "./editor-inputs";

export function AddCardDrawer(props: {
  saved: CollectionDraft;
  draft: CollectionDraft;
  cardMap: Record<string, CardData>;
  mergeCards: (cards: CardData[]) => void;
  updateCard: (id: string, finish: Finish, edit: Partial<Edit>) => void;
  close: () => void;
}) {
  const [showAddedOnly, setShowAddedOnly] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const catalog = useCardCatalog(props.mergeCards);
  useModalDialog(panelRef, props.close);

  const added = Object.entries(props.draft).filter(
    ([key, edit]) => !props.saved[key] && edit.quantity > 0,
  );
  const addedCardCount = new Set(
    added.map(([key]) => key.slice(key.indexOf(":") + 1)),
  ).size;
  const available = useMemo(
    () =>
      uniqueCards([
        ...catalog.cards,
        ...added
          .map(([key]) => props.cardMap[key.slice(key.indexOf(":") + 1)])
          .filter(Boolean),
      ]),
    [added, catalog.cards, props.cardMap],
  );
  const visible = showAddedOnly
    ? available.filter((card) => totalQuantity(props.draft, card.id) > 0)
    : available;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45"
      onMouseDown={(event) =>
        event.target === event.currentTarget && props.close()
      }
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="absolute inset-y-0 right-0 flex h-[100dvh] w-full flex-col bg-background shadow-2xl outline-none sm:w-[min(92vw,760px)]"
      >
        <header className="flex shrink-0 items-center justify-between border-b bg-card px-4 py-3 sm:py-4">
          <div>
            <h2 id="drawer-title" className="font-serif text-lg font-bold">
              Thêm card
            </h2>
            <p className="hidden text-[10px] text-muted-foreground sm:block">
              Tìm và thêm nhiều card vào bản nháp.
            </p>
          </div>
          <button
            onClick={props.close}
            aria-label="Đóng"
            className="grid size-11 place-items-center rounded-sm hover:bg-secondary sm:size-9"
          >
            <X />
          </button>
        </header>
        <div className="shrink-0 space-y-2 border-b bg-card p-3 max-sm:[&_input]:h-11 max-sm:[&_input]:text-sm">
          <SearchBox
            value={catalog.query}
            set={catalog.setQuery}
            placeholder="Tìm tên hoặc mã card..."
          />
          <div className="grid grid-cols-2 gap-2 [&>details>summary]:w-full">
            <FilterDropdown
              label="Set"
              value={catalog.values[0]}
              options={catalog.filters.sets}
              onChange={(x) => catalog.setFilterValue(0, x)}
            />
            <FilterDropdown
              label="Loại"
              value={catalog.values[1]}
              options={catalog.filters.types}
              onChange={(x) => catalog.setFilterValue(1, x)}
            />
            <FilterDropdown
              label="Độ hiếm"
              value={catalog.values[2]}
              options={catalog.filters.rarities}
              onChange={(x) => catalog.setFilterValue(2, x)}
            />
            <DomainFilter
              value={catalog.values[3]}
              options={catalog.filters.domains}
              onChange={(x) => catalog.setFilterValue(3, x)}
            />
          </div>
        </div>
        <div
          ref={catalog.scrollRef}
          className="collection-scrollbar flex-1 overflow-y-auto p-3"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {visible.map((card) => {
              return (
                <DrawerCard
                  key={card.id}
                  card={card}
                  draft={props.draft}
                  updateCard={props.updateCard}
                />
              );
            })}
          </div>
          {catalog.loading && (
            <div className="grid h-20 place-items-center">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}
          {!catalog.loading && !visible.length && (
            <div className="grid h-40 place-items-center text-xs text-muted-foreground">
              Không tìm thấy card có thể thêm.
            </div>
          )}
          <div ref={catalog.moreRef} className="h-2" />
        </div>
        <footer className="flex shrink-0 flex-col gap-3 border-t bg-card p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <span className="text-xs text-muted-foreground sm:text-[10px]">
            <strong className="text-foreground">{addedCardCount}</strong> loại ·{" "}
            <strong className="text-foreground">
              {added.reduce((total, [, edit]) => total + edit.quantity, 0)}
            </strong>{" "}
            bản vừa thêm
          </span>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-bold sm:min-h-0 sm:text-[10px]">
              <input
                type="checkbox"
                checked={showAddedOnly}
                onChange={(event) => setShowAddedOnly(event.target.checked)}
                className="size-4 accent-primary"
              />
              Chỉ hiện đã thêm
            </label>
            <Button className="min-h-11 px-6" onClick={props.close}>
              Xong
            </Button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function DrawerCard(props: {
  card: CardData;
  draft: CollectionDraft;
  updateCard: (id: string, finish: Finish, edit: Partial<Edit>) => void;
}) {
  const { card } = props;
  const nonfoil = editFor(props.draft, card.id, "nonfoil");
  const foil = editFor(props.draft, card.id, "foil");
  const canHaveBoth = supportsDualFinish(card.rarity);
  const both = canHaveBoth && nonfoil.quantity > 0 && foil.quantity > 0;
  const [singleFinish, setSingleFinish] = useState<Finish>(() =>
    canHaveBoth
      ? foil.quantity > 0 && nonfoil.quantity <= 0 ? "foil" : "nonfoil"
      : defaultFinish(card.rarity),
  );
  useEffect(() => {
    if (!both) {
      if (foil.quantity > 0) setSingleFinish("foil");
      else if (nonfoil.quantity > 0) setSingleFinish("nonfoil");
    }
  }, [both, foil.quantity, nonfoil.quantity]);

  const setVariant = (finish: Finish, quantity: number) => {
    const edit = editFor(props.draft, card.id, finish);
    props.updateCard(card.id, finish, {
      quantity,
      minPrice: props.draft[variantKey(card.id, finish)]
        ? edit.minPrice
        : defaultMin(card.rarity),
      tcgMultiplier: props.draft[variantKey(card.id, finish)]
        ? edit.tcgMultiplier
        : defaultMultiplier(card.rarity),
    });
  };
  const setBoth = (enabled: boolean) => {
    const other: Finish = singleFinish === "foil" ? "nonfoil" : "foil";
    if (enabled && editFor(props.draft, card.id, singleFinish).quantity <= 0) {
      setVariant(singleFinish, 1);
    }
    setVariant(other, enabled ? Math.max(1, editFor(props.draft, card.id, other).quantity) : 0);
  };
  const quantity = nonfoil.quantity + foil.quantity;

  return (
    <article className="flex gap-3 rounded-sm border bg-card p-3 sm:p-2">
      <CardImage
        card={card}
        className="h-32 w-[92px] border-0 bg-transparent"
        imageClassName="object-contain"
      />
      <div className="min-w-0 flex-1">
        <strong className="line-clamp-2 text-sm leading-5 sm:block sm:truncate sm:text-[11px] sm:leading-normal">
          {card.name}
        </strong>
        <p className="mt-1 text-xs text-muted-foreground sm:text-[9px]">
          {card.set} · #{card.collectorNumber} · {card.rarity}
        </p>
        <p className="truncate text-xs sm:text-[9px]" style={{ color: domainColor(card.domains[0]) }}>
          {card.domains.join(" · ") || "Không có Domain"}
        </p>
        {canHaveBoth && <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-bold">
            <input type="checkbox" checked={both} onChange={(event) => setBoth(event.target.checked)} className="size-3.5 accent-primary" />
            Có cả Foil &amp; Thường
          </label>
        </div>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {canHaveBoth && nonfoil.quantity > 0 && <DrawerVariant card={card} finish="nonfoil" edit={nonfoil} showFinish={both} exists updateCard={props.updateCard} />}
          {foil.quantity > 0 && <DrawerVariant card={card} finish="foil" edit={foil} showFinish={both || !canHaveBoth} exists updateCard={props.updateCard} />}
          {!quantity && <DrawerVariant card={card} finish={singleFinish} edit={editFor(props.draft, card.id, singleFinish)} showFinish={!canHaveBoth} exists={Boolean(props.draft[variantKey(card.id, singleFinish)])} updateCard={props.updateCard} />}
        </div>
        {quantity > 0 && <div className="mt-2 text-right"><span className="rounded-sm bg-accent/40 px-1.5 py-1 text-[9px] font-bold">Đã thêm {quantity}</span></div>}
      </div>
    </article>
  );
}

function DrawerVariant(props: {
  card: CardData;
  finish: Finish;
  edit: Edit;
  showFinish: boolean;
  exists: boolean;
  updateCard: (id: string, finish: Finish, edit: Partial<Edit>) => void;
}) {
  const label = props.finish === "foil" ? "Foil" : "Thường";
  return (
    <div className="flex items-center justify-between gap-2 rounded-sm border bg-background/60 px-2 py-1">
      {props.showFinish && <span className="text-[10px] font-bold">{label}</span>}
      <QuantityInput
        value={props.edit.quantity}
        name={`${props.card.name} ${label}`}
        set={(quantity) =>
          props.updateCard(props.card.id, props.finish, {
            quantity,
            minPrice: props.exists
              ? props.edit.minPrice
              : defaultMin(props.card.rarity),
            tcgMultiplier: props.exists
              ? props.edit.tcgMultiplier
              : defaultMultiplier(props.card.rarity),
          })
        }
      />
    </div>
  );
}
