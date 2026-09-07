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
  tcgPrice?: number;
};

export type Finish = "nonfoil" | "foil";

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
  tcgPrice?: number;
  quantity: number;
  minPrice: number | string;
  tcgMultiplier: number;
};

export type Edit = {
  finish: Finish;
  quantity: number;
  minPrice: number;
  tcgMultiplier: number;
};

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
