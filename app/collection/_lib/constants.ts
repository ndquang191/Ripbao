import { RIFTBOUND_DOMAINS } from "@/lib/riftbound-constants";

export const DOMAIN_ORDER: readonly string[] = RIFTBOUND_DOMAINS;

export const QUICK_PRICING_RARITIES = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Overnumbered",
];

export const QUICK_PRICING_RARITY_COLORS: Record<string, string> = {
  Common: "#e5e7eb",
  Uncommon: "#a7f3d0",
  Rare: "#fbcfe8",
  Epic: "#a5f3fc",
  Overnumbered: "#fef08a",
};

export const DEFAULT_TCG_MULTIPLIERS: Record<string, number> = {
  common: 25,
  uncommon: 25,
  rare: 25,
  epic: 25,
  legendary: 25,
  overnumbered: 25,
};
