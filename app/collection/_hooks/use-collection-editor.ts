"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { currencyConfig } from "@/lib/currency";
import { useDebounce } from "@/lib/use-debounce";
import {
  compareBySort,
  defaultMin,
  defaultMultiplier,
  domainRank,
  editOf,
  fromListing,
  sameEdits,
  uniq,
} from "../_lib/collection-utils";
import { QUICK_PRICING_RARITIES } from "../_lib/constants";
import {
  type ApiListing,
  type CardData,
  type DomainGroup,
  type Edit,
  type Filters,
  type Sort,
} from "../_lib/models";
import { useUnsavedChanges } from "./use-unsaved-changes";

export function useCollectionEditor() {
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState<Record<string, Edit>>({});
  const [draft, setDraft] = useState<Record<string, Edit>>({});
  const [cardMap, setCardMap] = useState<Record<string, CardData>>({});
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [filter, setFilter] = useState(["", "", "", ""]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const [pricingOpen, setPricingOpen] = useState(false);
  const [sort, setSort] = useState<Sort>({ key: "name", direction: "asc" });
  const [minimums, setMinimums] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      Object.entries(currencyConfig.quickMinimums).map(([rarity, value]) => [
        rarity[0].toUpperCase() + rarity.slice(1),
        value,
      ]),
    ),
  );
  const [multipliers, setMultipliers] = useState<Record<string, number>>({
    Common: 0.8,
    Uncommon: 0.85,
    Rare: 0.9,
    Epic: 0.95,
    Legendary: 1,
  });

  useEffect(() => {
    fetch("/api/listings")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { items?: ApiListing[]; user?: { username: string } }) => {
        const items = data.items ?? [];
        const baseline = Object.fromEntries(
          items.map((item) => [
            item.cardId,
            {
              quantity: item.quantity,
              minPrice: Number(item.minPrice),
              tcgMultiplier: Number(item.tcgMultiplier),
            },
          ]),
        );
        setUsername(data.user?.username ?? "");
        setSaved(baseline);
        setDraft(baseline);
        setCardMap(
          Object.fromEntries(
            items.map((item) => [item.cardId, fromListing(item)]),
          ),
        );
      })
      .finally(() => setReady(true));
  }, []);

  const dirty = useMemo(() => !sameEdits(saved, draft), [saved, draft]);
  useUnsavedChanges(dirty);

  const cards = useMemo(
    () =>
      Object.keys(draft)
        .filter((id) => saved[id] || draft[id].quantity > 0)
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
        list.sort((a, b) => compareBySort(a, b, draft, sort)),
      ]);
  }, [draft, sort, visibleCards]);
  const positiveEdits = Object.values(draft).filter(
    (edit) => edit.quantity > 0,
  );

  const updateCard = useCallback((id: string, patch: Partial<Edit>) => {
    setSaveStatus("idle");
    setDraft((current) => ({
      ...current,
      [id]: { ...editOf(current[id]), ...patch },
    }));
  }, []);
  const mergeCards = useCallback((incoming: CardData[]) => {
    setCardMap((current) => ({
      ...current,
      ...Object.fromEntries(incoming.map((card) => [card.id, card])),
    }));
  }, []);
  const changeSort = useCallback((key: Sort["key"]) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === "asc"
            ? "desc"
            : "asc"
          : key === "name"
            ? "asc"
            : "desc",
    }));
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
          next[card.id]?.quantity > 0 &&
          QUICK_PRICING_RARITIES.includes(card.rarity)
        ) {
          next[card.id] = {
            ...next[card.id],
            minPrice: minimums[card.rarity] ?? defaultMin(card.rarity),
            tcgMultiplier:
              multipliers[card.rarity] ?? defaultMultiplier(card.rarity),
          };
        }
      });
      return next;
    });
    setPricingOpen(false);
  }, [cards, minimums, multipliers]);
  const saveChanges = useCallback(async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const response = await fetch("/api/listings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: Object.entries(draft).map(([cardId, edit]) => ({
            cardId,
            ...edit,
          })),
        }),
      });
      if (!response.ok) throw new Error();
      const clean = Object.fromEntries(
        Object.entries(draft).filter(([, edit]) => edit.quantity > 0),
      );
      setSaved(clean);
      setDraft(clean);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1800);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [dirty, draft, saving]);

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
    pricingOpen,
    setPricingOpen,
    sort,
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
