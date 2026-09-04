export const DOMAIN_ORDER = ["Body", "Calm", "Chaos", "Fury", "Mind", "Order"];

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
  common: 0.8,
  uncommon: 0.85,
  rare: 0.9,
  epic: 0.95,
  legendary: 1,
};
