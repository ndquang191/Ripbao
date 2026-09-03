"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PageLoading } from "@/components/page-loading";

export type SessionUser = {
  username: string;
  displayName: string;
  facebookUrl: string | null;
  isGuest?: boolean;
};

export type CartItem = {
  key: string;
  cardId: string;
  seller: string;
  sellerFacebookUrl?: string;
  name: string;
  set: string;
  number: string;
  finish: string;
  condition: string;
  price: string;
  imageUrl?: string;
  glyph: string;
  gradient: string;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  sessionUser: SessionUser | null;
  setSessionUser: (user: SessionUser | null) => void;
  addItem: (item: Omit<CartItem, "key" | "quantity">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const storageKey = "ripbao.cart.v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [remote, setRemote] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const cartRequest = fetch("/api/cart").then(async (response) => {
      if (!response.ok) throw new Error();
      const data = await response.json() as { items?: Array<{ cardId: string; seller: string; sellerFacebookUrl?: string; name: string; set: string; number: number; finish: string; condition: string; unitPrice: number; imageUrl: string; stock: number; quantity: number }> };
      setItems((data.items ?? []).map((item) => ({ key: `${item.seller}:${item.cardId}`, cardId: item.cardId, seller: item.seller, sellerFacebookUrl: item.sellerFacebookUrl, name: item.name, set: item.set, number: String(item.number).padStart(3, "0"), finish: item.finish === "foil" ? "Foil" : "No Foil", condition: item.condition, price: Number(item.unitPrice) > 0 ? `${Number(item.unitPrice).toLocaleString("vi-VN")} ₫` : "Liên hệ", imageUrl: item.imageUrl, glyph: "R", gradient: "from-[#91c6bd] via-[#477a78] to-[#283d54]", stock: Number(item.stock), quantity: Number(item.quantity) })));
      setRemote(true);
    }).catch(() => {
      try { const saved = window.localStorage.getItem(storageKey); if (saved) setItems(JSON.parse(saved) as CartItem[]); } catch { window.localStorage.removeItem(storageKey); }
    });
    const sessionRequest = fetch("/api/auth/session")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { user?: SessionUser | null }) => setSessionUser(data.user ?? null))
      .catch(() => setSessionUser(null));

    Promise.allSettled([cartRequest, sessionRequest]).then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (remote) {
      void fetch("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    } else {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, ready, remote]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    sessionUser,
    setSessionUser,
    addItem: (item) => setItems((current) => {
      const key = `${item.seller}:${item.cardId}`;
      const existing = current.find((entry) => entry.key === key);
      if (existing) return current.map((entry) => entry.key === key ? { ...entry, quantity: Math.min(entry.quantity + 1, entry.stock) } : entry);
      return [...current, { ...item, key, quantity: 1 }];
    }),
    updateQuantity: (key, quantity) => setItems((current) => current
      .map((item) => item.key === key ? { ...item, quantity: Math.max(0, Math.min(quantity, item.stock)) } : item)
      .filter((item) => item.quantity > 0)),
    removeItem: (key) => setItems((current) => current.filter((item) => item.key !== key)),
    clear: () => setItems([]),
  }), [items, sessionUser]);

  if (!ready) return <PageLoading />;

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
