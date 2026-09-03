export const RIFTBOUND_DOMAINS = [
  "Body",
  "Calm",
  "Chaos",
  "Fury",
  "Mind",
  "Order",
] as const;

export const RIFTBOUND_DOMAIN_COLORS: Record<(typeof RIFTBOUND_DOMAINS)[number], string> = {
  Body: "#c2410c",
  Calm: "#4d7c0f",
  Chaos: "#7e22ce",
  Fury: "#b91c1c",
  Mind: "#1d4ed8",
  Order: "#ca8a04",
};

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
