export const guestTradesStorageKey = "ripbao.guest-trades.v1";

export type StoredGuestTrade = {
  id: string;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  completedAt: string | null;
  buyerContactPhone: null;
  buyer: string;
  buyerFacebookUrl: null;
  seller: string;
  sellerFacebookUrl: string | null;
  role: "buyer";
  counterparty: string;
  counterpartyUsername: string;
  counterpartyFacebookUrl: string | null;
  counterpartyIsGuest: false;
  items: Array<{
    id: string;
    cardId: string;
    name: string;
    set: string;
    number: number;
    imageUrl: string;
    finish: string;
    condition: string;
    quantity: number;
    unitPrice: number;
    stock: number;
  }>;
};

export function readGuestTrades(): StoredGuestTrade[] {
  try {
    const value = window.localStorage.getItem(guestTradesStorageKey);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(guestTradesStorageKey);
    return [];
  }
}

export function saveGuestTrade(trade: StoredGuestTrade) {
  const current = readGuestTrades().filter((item) => item.id !== trade.id);
  window.localStorage.setItem(guestTradesStorageKey, JSON.stringify([trade, ...current]));
}

export function removeGuestTrade(id: string) {
  window.localStorage.setItem(
    guestTradesStorageKey,
    JSON.stringify(readGuestTrades().filter((trade) => trade.id !== id)),
  );
}
