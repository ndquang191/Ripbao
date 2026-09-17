import { currencyConfig, formatCurrency } from "@/lib/currency";
import { RIFTBOUND_DOMAIN_COLORS } from "@/lib/riftbound-constants";
import { DEFAULT_TCG_MULTIPLIERS, DOMAIN_ORDER } from "./constants";
import {
  type ApiListing,
  type CardData,
  type CollectionDraft,
  type Edit,
  type Finish,
  type Sort,
} from "./models";

const domainColors: Record<string, string> = RIFTBOUND_DOMAIN_COLORS;

export function fromListing(x: ApiListing): CardData {
  return {
    id: x.cardId,
    collectorNumber: x.collectorNumber,
    name: x.name,
    set: x.set,
    rarity: x.rarity,
    type: x.type,
    domains: x.domains ?? [],
    supertype: x.supertype,
    imageUrl: x.imageUrl,
    tcgPrice: x.tcgPrice,
  };
}

export function editOf(x?: Partial<Edit>): Edit {
  return {
    quantity: x?.quantity ?? 0,
    minPrice: Number(x?.minPrice) || 0,
    tcgMultiplier: Number(x?.tcgMultiplier) || 0.9,
  };
}

export const FINISHES: Finish[] = ["nonfoil", "foil"];

const DUAL_FINISH_RARITIES = new Set(["common", "uncommon"]);

export function supportsDualFinish(rarity: string) {
  return DUAL_FINISH_RARITIES.has(rarity.toLowerCase());
}

export function defaultFinish(rarity: string): Finish {
  return supportsDualFinish(rarity) ? "nonfoil" : "foil";
}

export function variantKey(cardId: string, finish: Finish) {
  return `${finish}:${cardId}`;
}

export function cardIdFromVariantKey(key: string) {
  return key.slice(key.indexOf(":") + 1);
}

export function editFor(draft: CollectionDraft, cardId: string, finish: Finish) {
  return editOf(draft[variantKey(cardId, finish)]);
}

export function totalQuantity(draft: CollectionDraft, cardId: string) {
  return FINISHES.reduce(
    (total, finish) => total + editFor(draft, cardId, finish).quantity,
    0,
  );
}

export function sameEdits(a: Record<string, Edit>, b: Record<string, Edit>) {
  return uniq([...Object.keys(a), ...Object.keys(b)]).every((id) => {
    const x = editOf(a[id]);
    const y = editOf(b[id]);
    return (
      x.quantity === y.quantity &&
      x.minPrice === y.minPrice &&
      x.tcgMultiplier === y.tcgMultiplier
    );
  });
}

export function uniq(x: string[]) {
  return [...new Set(x.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function uniqueCards(x: CardData[]) {
  return [
    ...new Map(x.filter(Boolean).map((card) => [card.id, card])).values(),
  ];
}

export function domainRank(domain: string) {
  const rank = DOMAIN_ORDER.indexOf(domain);
  return rank < 0 ? DOMAIN_ORDER.length : rank;
}

export function domainColor(domain?: string) {
  return domainColors[domain ?? ""] ?? "#706f68";
}

function compareCards(a: CardData, b: CardData) {
  return (
    a.name.localeCompare(b.name, "vi", { sensitivity: "base" }) ||
    a.set.localeCompare(b.set) ||
    a.collectorNumber - b.collectorNumber
  );
}

export function compareBySort(
  a: CardData,
  b: CardData,
  draft: CollectionDraft,
  sort: Sort,
) {
  const aEdits = FINISHES.map((finish) => editFor(draft, a.id, finish));
  const bEdits = FINISHES.map((finish) => editFor(draft, b.id, finish));
  const result =
    sort.key === "name"
      ? compareCards(a, b)
      : sort.key === "quantity"
        ? totalQuantity(draft, a.id) - totalQuantity(draft, b.id)
        : lowestFinalPrice(a, aEdits) - lowestFinalPrice(b, bEdits);
  return (sort.direction === "asc" ? result : -result) || compareCards(a, b);
}

function lowestFinalPrice(card: CardData, edits: Edit[]) {
  const active = edits.filter((edit) => edit.quantity > 0);
  return active.length
    ? Math.min(...active.map((edit) => finalPriceValue(card, edit)))
    : 0;
}

export function finalPrice(card: CardData, edit: Edit) {
  const value = finalPriceValue(card, edit);
  return value > 0 ? formatCurrency(value) : "—";
}

export function finalPriceValue(card: CardData, edit: Edit) {
  return Math.max(edit.minPrice, (card.tcgPrice ?? 0) * edit.tcgMultiplier);
}

export function defaultMin(rarity: string) {
  return currencyConfig.quickMinimums[rarity.toLowerCase()] ?? 0;
}

export function defaultMultiplier(rarity: string) {
  return DEFAULT_TCG_MULTIPLIERS[rarity.toLowerCase()] ?? 0.9;
}
