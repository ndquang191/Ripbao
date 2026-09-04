"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { DomainFilter, FilterDropdown } from "@/components/domain-filter";
import { Button } from "@/components/ui/button";
import { useCardCatalog } from "../_hooks/use-card-catalog";
import { useModalDialog } from "../_hooks/use-modal-dialog";
import {
  defaultMin,
  defaultMultiplier,
  domainColor,
  uniqueCards,
} from "../_lib/collection-utils";
import { type CardData, type Edit } from "../_lib/models";
import { CardImage, QuantityInput, SearchBox } from "./editor-inputs";

export function AddCardDrawer(props: {
  savedIds: Set<string>;
  draft: Record<string, Edit>;
  cardMap: Record<string, CardData>;
  mergeCards: (cards: CardData[]) => void;
  updateCard: (id: string, edit: Partial<Edit>) => void;
  close: () => void;
}) {
  const [showAddedOnly, setShowAddedOnly] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const catalog = useCardCatalog(props.mergeCards);
  useModalDialog(panelRef, props.close);

  const added = Object.entries(props.draft).filter(
    ([id, edit]) => !props.savedIds.has(id) && edit.quantity > 0,
  );
  const available = useMemo(
    () =>
      uniqueCards([
        ...catalog.cards.filter((card) => !props.savedIds.has(card.id)),
        ...added.map(([id]) => props.cardMap[id]).filter(Boolean),
      ]),
    [added, catalog.cards, props.cardMap, props.savedIds],
  );
  const visible = showAddedOnly
    ? available.filter((card) => (props.draft[card.id]?.quantity ?? 0) > 0)
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
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-background shadow-2xl outline-none sm:w-[min(92vw,760px)]"
      >
        <header className="flex items-center justify-between border-b bg-card p-4">
          <div>
            <h2 id="drawer-title" className="font-serif text-lg font-bold">
              Thêm card
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Tìm và thêm nhiều card vào bản nháp.
            </p>
          </div>
          <button
            onClick={props.close}
            aria-label="Đóng"
            className="grid size-9 place-items-center rounded-sm hover:bg-secondary"
          >
            <X />
          </button>
        </header>
        <div className="space-y-2 border-b bg-card p-3">
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
              const quantity = props.draft[card.id]?.quantity ?? 0;
              return (
                <article
                  key={card.id}
                  className="flex gap-3 rounded-sm border bg-card p-2"
                >
                  <CardImage card={card} className="h-[88px] w-16" />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[11px]">
                      {card.name}
                    </strong>
                    <p className="mt-1 text-[9px] text-muted-foreground">
                      {card.set} · #{card.collectorNumber} · {card.rarity}
                    </p>
                    <p
                      className="truncate text-[9px]"
                      style={{ color: domainColor(card.domains[0]) }}
                    >
                      {card.domains.join(" · ") || "Không có Domain"}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityInput
                        value={quantity}
                        name={card.name}
                        set={(value) =>
                          props.updateCard(card.id, {
                            quantity: value,
                            minPrice:
                              props.draft[card.id]?.minPrice ??
                              defaultMin(card.rarity),
                            tcgMultiplier:
                              props.draft[card.id]?.tcgMultiplier ??
                              defaultMultiplier(card.rarity),
                          })
                        }
                      />
                      {quantity > 0 && (
                        <span className="rounded-sm bg-accent/40 px-1.5 py-1 text-[9px] font-bold">
                          Đã thêm {quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
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
        <footer className="flex items-center justify-between border-t bg-card p-4">
          <span className="text-[10px] text-muted-foreground">
            <strong className="text-foreground">{added.length}</strong> loại ·{" "}
            <strong className="text-foreground">
              {added.reduce((total, [, edit]) => total + edit.quantity, 0)}
            </strong>{" "}
            bản vừa thêm
          </span>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold">
              <input
                type="checkbox"
                checked={showAddedOnly}
                onChange={(event) => setShowAddedOnly(event.target.checked)}
                className="size-4 accent-primary"
              />
              Chỉ hiện đã thêm
            </label>
            <Button onClick={props.close}>Xong</Button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
