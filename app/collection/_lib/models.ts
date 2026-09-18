export type CardData = {
  id: string;
  collectorNumber: number;
  name: string;
  set: string;
  rarity: string;
  type: string;
  domains: string[];
  supertype?: string | null;
  imageUrl: string;
  tcgPrices: Partial<Record<Finish, TcgPrice>>;
};

export type Finish = "nonfoil" | "foil";

export type TcgPrice = {
  marketPriceUsd: number;
  sourceUpdatedAt: string;
};

export type ApiListing = {
  finish: Finish;
  cardId: string;
  collectorNumber: number;
  name: string;
  set: string;
  rarity: string;
  type: string;
  domains: string[];
  supertype?: string | null;
  imageUrl: string;
  marketPriceUsd?: number | null;
  priceSourceUpdatedAt?: string | null;
  quantity: number;
  minPrice: number | string;
  tcgMultiplier: number;
};

export type Edit = {
  quantity: number;
  minPrice: number;
  tcgMultiplier: number;
};

export type CollectionDraft = Record<string, Edit>;

export type Filters = {
  sets: string[];
  types: string[];
  rarities: string[];
  domains: string[];
};

export type Sort = {
  key: "name" | "quantity" | "finalPrice";
  direction: "asc" | "desc";
};

export type DomainGroup = [domain: string, cards: CardData[]];
