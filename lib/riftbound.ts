import "server-only";

export type RiftboundCardStats = {
  energy: number;
  might: number;
  cost: number;
  power: number;
};

export type RiftboundCardArt = {
  thumbnailURL: string;
  fullURL: string;
  artist: string;
};

export type RiftboundCard = {
  id: string;
  collectorNumber: number;
  set: string;
  setId: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  faction: string;
  stats: RiftboundCardStats;
  keywords: string[];
  art: RiftboundCardArt;
  flavorText: string;
  tags: string[];
};

type RiftboundSet = {
  id: string;
  name: string;
  cards: Omit<RiftboundCard, "setId">[];
};

type RiftboundContent = {
  game: string;
  version: string;
  lastUpdated: string;
  sets: RiftboundSet[];
};

export type RiftboundCardList = {
  game: string;
  version: string;
  lastUpdated: string;
  cards: RiftboundCard[];
};

const CONTENT_PATH = "/riftbound/content/v1/contents";

export async function getAllRiftboundCards(locale = "en"): Promise<RiftboundCardList> {
  const baseUrl = process.env.RIFTBOUND_API_BASE_URL?.replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error("RIFTBOUND_API_BASE_URL is not configured");
  }

  const url = new URL(`${baseUrl}${CONTENT_PATH}`);
  url.searchParams.set("locale", locale);

  const headers = new Headers({ Accept: "application/json" });
  const apiKey = process.env.RIFTBOUND_API_KEY;

  if (apiKey) {
    headers.set(process.env.RIFTBOUND_API_KEY_HEADER || "X-Riot-Token", apiKey);
  }

  const response = await fetch(url, {
    headers,
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`Riftbound API returned ${response.status} ${response.statusText}`);
  }

  const content = (await response.json()) as RiftboundContent;

  return {
    game: content.game,
    version: content.version,
    lastUpdated: content.lastUpdated,
    cards: content.sets.flatMap((set) =>
      set.cards.map((card) => ({
        ...card,
        set: set.name || card.set,
        setId: set.id,
      })),
    ),
  };
}
