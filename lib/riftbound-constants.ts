export const RIFTBOUND_DOMAINS = [
  "Body",
  "Calm",
  "Chaos",
  "Colorless",
  "Fury",
  "Mind",
  "Order",
] as const;

export const RIFTBOUND_DOMAIN_COLORS: Record<
  (typeof RIFTBOUND_DOMAINS)[number],
  string
> = {
  Body: "#c2410c",
  Calm: "#4d7c0f",
  Chaos: "#7e22ce",
  Colorless: "#64748b",
  Fury: "#b91c1c",
  Mind: "#1d4ed8",
  Order: "#ca8a04",
};

export const RIFTBOUND_SETS = [
  { code: "OGN", name: "Origins" },
  { code: "OGS", name: "Proving Grounds" },
  { code: "OPP", name: "Riftbound Organized Play Promotional Cards" },
  { code: "PR", name: "Riftbound Promotional Cards" },
  { code: "JDG", name: "Riftbound Judge Promotional Cards" },
  { code: "SFD", name: "Spiritforged" },
  { code: "UNL", name: "Unleashed" },
  { code: "VEN", name: "Vendetta" },
] as const;

export const RIFTBOUND_SET_NAMES = RIFTBOUND_SETS.map((set) => set.name);
export const RIFTBOUND_SET_CODES: Record<string, string> = Object.fromEntries(
  RIFTBOUND_SETS.map((set) => [set.name, set.code]),
);

export const RIFTBOUND_CARD_TYPES = [
  "Gear",
  "Legend",
  "Rune",
  "Spell",
  "Unit",
] as const;

export const RIFTBOUND_CARD_SUPERTYPES = [
  "Basic",
  "Champion",
  "Signature",
  "Token",
] as const;

export const RIFTBOUND_RARITIES = [
  "Common",
  "Epic",
  "Promo",
  "Rare",
  "Showcase",
  "Uncommon",
] as const;

export const RIFTBOUND_AUTO_FOIL_RARITIES: readonly string[] = [
  "Epic",
  "Promo",
  "Rare",
  "Showcase",
  "Legendary",
  "Overnumbered",
];

export const RIFTBOUND_DUAL_FINISH_RARITIES: readonly string[] = [
  "Common",
  "Uncommon",
];

export const RIFTBOUND_FILTERS = {
  domains: RIFTBOUND_DOMAINS,
  types: RIFTBOUND_CARD_TYPES,
  supertypes: RIFTBOUND_CARD_SUPERTYPES,
  rarities: RIFTBOUND_RARITIES,
} as const;

export type RiftboundDomain = (typeof RIFTBOUND_DOMAINS)[number];
export type RiftboundCardType = (typeof RIFTBOUND_CARD_TYPES)[number];
export type RiftboundCardSupertype = (typeof RIFTBOUND_CARD_SUPERTYPES)[number];
export type RiftboundRarity = (typeof RIFTBOUND_RARITIES)[number];
export type RiftboundSetName = (typeof RIFTBOUND_SETS)[number]["name"];
