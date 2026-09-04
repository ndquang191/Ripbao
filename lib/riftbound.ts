import "server-only";
import { RIFTBOUND_FILTERS } from "@/lib/riftbound-constants";

const API_BASE_URL = "https://api.riftcodex.com";

export type RiftboundCard = {
  id: string;
  name: string;
  imageUrl: string;
  tcgplayerId: string;
  collectorNumber: number;
  set: string;
  domain: string[];
  type: string;
  supertype: string | null;
  rarity: string;
  isNew: boolean;
};

export type CardPage = {
  items: RiftboundCard[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

export type CardFilters = {
  readonly domains: readonly string[];
  readonly types: readonly string[];
  readonly supertypes: readonly string[];
  readonly rarities: readonly string[];
};

export type GetCardsOptions = {
  page?: number;
  size?: number;
  name?: string;
  match?: "exact" | "fuzzy";
  sort?: "name";
  direction?: 1 | -1;
};

type ApiCard = {
  id: string;
  name: string;
  tcgplayer_id: string;
  collector_number: number;
  set: { set_id: string; label: string };
  classification: {
    domain: string[];
    type: string;
    supertype: string | null;
    rarity: string;
  };
  media: { image_url: string };
  new?: boolean;
};

type ApiPage<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

export class RiftboundApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "RiftboundApiError";
  }
}

async function request<T>(path: string, revalidate: number): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new RiftboundApiError(
      response.status,
      `Riftcodex returned ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

function toCard(card: ApiCard): RiftboundCard {
  return {
    id: card.id,
    name: card.name,
    imageUrl: card.media.image_url,
    tcgplayerId: card.tcgplayer_id,
    collectorNumber: card.collector_number,
    set: card.set.label,
    domain: card.classification.domain,
    type: card.classification.type,
    supertype: card.classification.supertype,
    rarity: card.classification.rarity,
    isNew: card.new === true,
  };
}

export async function getCards(
  options: GetCardsOptions = {},
): Promise<CardPage> {
  const page = Math.max(1, options.page ?? 1);
  const size = Math.min(100, Math.max(1, options.size ?? 50));
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const name = options.name?.trim();
  const path = name ? "/cards/name" : "/cards";

  if (name) params.set(options.match === "exact" ? "exact" : "fuzzy", name);
  if (options.sort) params.set("sort", options.sort);
  if (options.direction) params.set("dir", String(options.direction));

  const result = await request<ApiPage<ApiCard>>(`${path}?${params}`, 5 * 60);
  return {
    ...result,
    items: result.items
      .filter(
        (card) => card.classification.type.toLowerCase() !== "battlefield",
      )
      .map(toCard),
  };
}

export async function getAllCards(): Promise<RiftboundCard[]> {
  const firstPage = await getCards({
    page: 1,
    size: 100,
    sort: "name",
    direction: 1,
  });
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.pages - 1) }, (_, index) =>
      getCards({ page: index + 2, size: 100, sort: "name", direction: 1 }),
    ),
  );

  return [firstPage, ...remainingPages]
    .flatMap((page) => page.items)
    .sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    );
}

export function getCardFilters(): CardFilters {
  return RIFTBOUND_FILTERS;
}
