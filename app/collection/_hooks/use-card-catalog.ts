"use client";

import { useEffect, useRef, useState } from "react";
import {
  RIFTBOUND_CARD_TYPES,
  RIFTBOUND_DOMAINS,
  RIFTBOUND_RARITIES,
} from "@/lib/riftbound-constants";
import { useDebounce } from "@/lib/use-debounce";
import { uniqueCards } from "../_lib/collection-utils";
import { type CardData, type Filters } from "../_lib/models";

export function useCardCatalog(mergeCards: (cards: CardData[]) => void) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [values, setValues] = useState(["", "", "", ""]);
  const [filters, setFilters] = useState<Filters>({
    sets: [],
    types: [...RIFTBOUND_CARD_TYPES],
    rarities: [...RIFTBOUND_RARITIES],
    domains: [...RIFTBOUND_DOMAINS],
  });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/cards/filters")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setFilters)
      .catch(() => undefined);
  }, []);

  useEffect(() => setPage(1), [debouncedQuery, values]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), size: "30" });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    ["set", "type", "rarity", "domain"].forEach(
      (key, index) => values[index] && params.set(key, values[index]),
    );
    setLoading(true);
    fetch(`/api/cards?${params}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { items?: CardData[]; pages?: number }) => {
        const incoming = data.items ?? [];
        mergeCards(incoming);
        setCards((current) =>
          uniqueCards(page === 1 ? incoming : [...current, ...incoming]),
        );
        setPages(Math.max(1, data.pages ?? 1));
      })
      .catch(() => undefined)
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [debouncedQuery, mergeCards, page, values]);

  useEffect(() => {
    const target = moreRef.current;
    if (!target || loading || page >= pages) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setPage((current) => current + 1),
      { root: scrollRef.current, rootMargin: "250px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, page, pages]);

  const setFilterValue = (index: number, value: string) =>
    setValues((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );

  return {
    query,
    setQuery,
    values,
    filters,
    cards,
    loading,
    scrollRef,
    moreRef,
    setFilterValue,
  };
}
