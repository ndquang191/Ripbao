"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { currencyConfig } from "@/lib/currency";
import { useDebounce } from "@/lib/use-debounce";
import {
  compareBySort,
  cardIdFromVariantKey,
  defaultMin,
  defaultMultiplier,
  defaultFinish,
  domainRank,
  editOf,
  FINISHES,
  fromListing,
  sameEdits,
  totalQuantity,
  uniq,
  variantKey,
} from "../_lib/collection-utils";
import { QUICK_PRICING_RARITIES } from "../_lib/constants";
import {
  type ApiListing,
  type CardData,
  type DomainGroup,
  type CollectionDraft,
  type Edit,
  type Finish,
  type Filters,
  type Sort,
} from "../_lib/models";
import { useUnsavedChanges } from "./use-unsaved-changes";

const DEFAULT_SORT: Sort = { key: "name", direction: "asc" };

export function useCollectionEditor() {
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState<CollectionDraft>({});
  const [draft, setDraft] = useState<CollectionDraft>({});
  const [cardMap, setCardMap] = useState<Record<string, CardData>>({});
  const requestedPriceKeys = useRef(new Set<string>());
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [filter, setFilter] = useState(["", "", "", ""]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "price-warning" | "error">(
    "idle",
  );
  const [priceLookupWarning, setPriceLookupWarning] = useState(false);
  const [pendingPriceLookups, setPendingPriceLookups] = useState(0);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [domainSorts, setDomainSorts] = useState<Record<string, Sort>>({});
  const getSort = useCallback(
    (domain: string) => domainSorts[domain] ?? DEFAULT_SORT,
    [domainSorts],
  );
  const [minimums, setMinimums] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      Object.entries(currencyConfig.quickMinimums).map(([rarity, value]) => [
        rarity[0].toUpperCase() + rarity.slice(1),
        value,
      ]),
    ),
  );
  const [multipliers, setMultipliers] = useState<Record<string, number>>({
    Common: 25,
    Uncommon: 25,
    Rare: 25,
    Epic: 25,
    Legendary: 25,
    Overnumbered: 25,
  });

  useEffect(() => {
    fetch("/api/listings")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { items?: ApiListing[]; user?: { username: string } }) => {
        const items = data.items ?? [];
        const baseline = items.reduce<CollectionDraft>((result, item) => {
          const finish = defaultFinish(item.rarity) === "foil"
            ? "foil"
            : item.finish ?? "nonfoil";
          const key = variantKey(item.cardId, finish);
          const existing = result[key];
          result[key] = {
            quantity: (existing?.quantity ?? 0) + item.quantity,
            minPrice: Math.max(existing?.minPrice ?? 0, Number(item.minPrice)),
            tcgMultiplier: Math.max(existing?.tcgMultiplier ?? 0, Number(item.tcgMultiplier)),
          };
          return result;
        }, {});
        setUsername(data.user?.username ?? "");
        setSaved(baseline);
        setDraft(baseline);
        setCardMap(items.reduce<Record<string, CardData>>((result, item) => {
          const incoming = fromListing(item);
          const current = result[item.cardId];
          result[item.cardId] = current
            ? { ...current, tcgPrices: { ...current.tcgPrices, ...incoming.tcgPrices } }
            : incoming;
          return result;
        }, {}));
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const missing = Object.entries(draft).flatMap(([key, edit]) => {
      if (edit.quantity <= 0 || requestedPriceKeys.current.has(key)) return [];
      const cardId = cardIdFromVariantKey(key);
      const finish: Finish = key.startsWith("foil:") ? "foil" : "nonfoil";
      const card = cardMap[cardId];
      if (!card || card.tcgPrices[finish]) return [];
      return [{ key, cardId, finish }];
    });
    if (!missing.length) return;
    const timer = window.setTimeout(async () => {
      missing.forEach((item) => requestedPriceKeys.current.add(item.key));
      setPendingPriceLookups((count) => count + 1);
      try {
        const response = await fetch("/api/prices/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: missing.map(({ cardId, finish }) => ({ cardId, finish })),
          }),
        });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as {
          priceUpdates?: Array<{
            cardId: string;
            finish: Finish;
            marketPriceUsd: number;
            sourceUpdatedAt: string;
          }>;
        };
        setCardMap((current) => {
          const next = { ...current };
          data.priceUpdates?.forEach((price) => {
            const card = next[price.cardId];
            if (!card) return;
            next[price.cardId] = {
              ...card,
              tcgPrices: {
                ...card.tcgPrices,
                [price.finish]: {
                  marketPriceUsd: Number(price.marketPriceUsd),
                  sourceUpdatedAt: price.sourceUpdatedAt,
                },
              },
            };
          });
          return next;
        });
      } catch {
        setPriceLookupWarning(true);
        window.setTimeout(() => setPriceLookupWarning(false), 6_000);
      } finally {
        setPendingPriceLookups((count) => Math.max(0, count - 1));
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [cardMap, draft, ready]);

  const dirty = useMemo(() => !sameEdits(saved, draft), [saved, draft]);
  useUnsavedChanges(dirty);

  const cards = useMemo(
    () =>
      uniq(Object.keys(draft).map(cardIdFromVariantKey))
        .filter((id) =>
          FINISHES.some((finish) => {
            const key = variantKey(id, finish);
            return saved[key] || draft[key]?.quantity > 0;
          }),
        )
        .map((id) => cardMap[id])
        .filter(Boolean),
    [cardMap, draft, saved],
  );
  const options = useMemo<Filters>(
    () => ({
      sets: uniq(cards.map((card) => card.set)),
      types: uniq(cards.map((card) => card.type)),
      rarities: uniq(cards.map((card) => card.rarity)),
      domains: uniq(cards.flatMap((card) => card.domains)),
    }),
    [cards],
  );
  const visibleCards = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLocaleLowerCase("vi");
    return cards.filter(
      (card) =>
        (!normalizedQuery ||
          [card.name, card.set, String(card.collectorNumber)].some((value) =>
            value.toLocaleLowerCase("vi").includes(normalizedQuery),
          )) &&
        (!filter[0] || card.set === filter[0]) &&
        (!filter[1] || card.type === filter[1]) &&
        (!filter[2] || card.rarity === filter[2]) &&
        (!filter[3] || card.domains.includes(filter[3])),
    );
  }, [cards, debouncedQuery, filter]);
  const groups = useMemo<DomainGroup[]>(() => {
    const grouped = new Map<string, CardData[]>();
    visibleCards.forEach((card) => {
      const domain = card.domains[0] || "Không có Domain";
      grouped.set(domain, [...(grouped.get(domain) ?? []), card]);
    });
    return [...grouped]
      .sort(([a], [b]) => domainRank(a) - domainRank(b))
      .map(([domain, list]) => [
        domain,
        list.sort((a, b) => compareBySort(a, b, draft, getSort(domain))),
      ]);
  }, [draft, getSort, visibleCards]);
  const positiveEdits = Object.values(draft).filter(
    (edit) => edit.quantity > 0,
  );

  const updateCard = useCallback((id: string, finish: Finish, patch: Partial<Edit>) => {
    setSaveStatus("idle");
    setDraft((current) => ({
      ...current,
      [variantKey(id, finish)]: {
        ...editOf(current[variantKey(id, finish)]),
        ...patch,
      },
    }));
  }, []);
  const mergeCards = useCallback((incoming: CardData[]) => {
    setCardMap((current) => incoming.reduce((result, card) => ({
      ...result,
      [card.id]: {
        ...result[card.id],
        ...card,
        tcgPrices: { ...result[card.id]?.tcgPrices, ...card.tcgPrices },
      },
    }), current));
  }, []);
  const changeSort = useCallback((domain: string, key: Sort["key"]) => {
    setDomainSorts((current) => {
      const sort = current[domain] ?? DEFAULT_SORT;
      return {
        ...current,
        [domain]: {
          key,
          direction:
            sort.key === key
              ? sort.direction === "asc"
                ? "desc"
                : "asc"
              : key === "name"
                ? "asc"
                : "desc",
        },
      };
    });
  }, []);
  const clearFilters = useCallback(() => {
    setQuery("");
    setFilter(["", "", "", ""]);
  }, []);
  const setMinimum = useCallback((rarity: string, value: number) => {
    setMinimums((current) => ({ ...current, [rarity]: value }));
  }, []);
  const setMultiplier = useCallback((rarity: string, value: number) => {
    setMultipliers((current) => ({ ...current, [rarity]: value }));
  }, []);
  const applyBulkPricing = useCallback(() => {
    setSaveStatus("idle");
    setDraft((current) => {
      const next = { ...current };
      cards.forEach((card) => {
        if (
          totalQuantity(next, card.id) > 0 &&
          QUICK_PRICING_RARITIES.includes(card.rarity)
        ) {
          FINISHES.forEach((finish) => {
            const key = variantKey(card.id, finish);
            if (next[key]?.quantity > 0) {
              next[key] = {
                ...next[key],
                minPrice: minimums[card.rarity] ?? defaultMin(card.rarity),
                tcgMultiplier:
                  multipliers[card.rarity] ?? defaultMultiplier(card.rarity),
              };
            }
          });
        }
      });
      return next;
    });
    setPricingOpen(false);
  }, [cards, minimums, multipliers]);
  const saveChanges = useCallback(async () => {
    if (!dirty || saving || pendingPriceLookups > 0) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const response = await fetch("/api/listings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: Object.entries(draft).map(([key, edit]) => ({
            cardId: cardIdFromVariantKey(key),
            finish: key.startsWith("foil:") ? "foil" : "nonfoil",
            ...edit,
          })),
        }),
      });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as {
        priceSync?: "synced" | "not-needed" | "failed";
        priceUpdates?: Array<{
          cardId: string;
          finish: Finish;
          marketPriceUsd: number;
          sourceUpdatedAt: string;
        }>;
      };
      if (data.priceUpdates?.length) {
        setCardMap((current) => {
          const next = { ...current };
          data.priceUpdates?.forEach((price) => {
            const card = next[price.cardId];
            if (!card) return;
            next[price.cardId] = {
              ...card,
              tcgPrices: {
                ...card.tcgPrices,
                [price.finish]: {
                  marketPriceUsd: Number(price.marketPriceUsd),
                  sourceUpdatedAt: price.sourceUpdatedAt,
                },
              },
            };
          });
          return next;
        });
      }
      const clean = Object.fromEntries(
        Object.entries(draft).filter(([, edit]) => edit.quantity > 0),
      );
      setSaved(clean);
      setDraft(clean);
      const nextStatus = data.priceSync === "failed" ? "price-warning" : "saved";
      setSaveStatus(nextStatus);
      setTimeout(() => setSaveStatus("idle"), nextStatus === "price-warning" ? 6_000 : 1_800);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [dirty, draft, pendingPriceLookups, saving]);

  return {
    username,
    saved,
    draft,
    cardMap,
    ready,
    query,
    setQuery,
    filter,
    setFilter,
    drawerOpen,
    setDrawerOpen,
    saving,
    saveStatus,
    priceLookupWarning,
    priceLookupPending: pendingPriceLookups > 0,
    pricingOpen,
    setPricingOpen,
    getSort,
    minimums,
    multipliers,
    setMinimum,
    setMultiplier,
    dirty,
    cards,
    options,
    groups,
    positiveEdits,
    updateCard,
    mergeCards,
    changeSort,
    clearFilters,
    applyBulkPricing,
    saveChanges,
  };
}
