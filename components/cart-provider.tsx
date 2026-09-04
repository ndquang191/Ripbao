"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  sellerDisplayName: string;
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
  sessionState: "anonymous" | "guest" | "authenticated" | "error";
  setSessionUser: (user: SessionUser | null) => void;
  addItem: (item: Omit<CartItem, "key" | "quantity">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
};

const storageKey = "ripbao.cart.v2";
const legacyStorageKeys = ["ripbao.cart.v1"];
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [remote, setRemote] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionState, setSessionState] =
    useState<CartContextValue["sessionState"]>("anonymous");
  const [saveStatus, setSaveStatus] =
    useState<CartContextValue["saveStatus"]>("idle");
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const saveRevision = useRef(0);

  useEffect(() => {
    for (const key of legacyStorageKeys) window.localStorage.removeItem(key);

    const cartRequest = fetch("/api/cart")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = (await response.json()) as {
          items?: Array<{
            cardId: string;
            seller: string;
            sellerDisplayName: string;
            sellerFacebookUrl?: string;
            name: string;
            set: string;
            number: number;
            finish: string;
            condition: string;
            unitPrice: number;
            imageUrl: string;
            stock: number;
            quantity: number;
          }>;
        };
        setItems(
          (data.items ?? []).map((item) => ({
            key: `${item.seller}:${item.cardId}`,
            cardId: item.cardId,
            seller: item.seller,
            sellerDisplayName: item.sellerDisplayName,
            sellerFacebookUrl: item.sellerFacebookUrl,
            name: item.name,
            set: item.set,
            number: String(item.number).padStart(3, "0"),
            finish: item.finish === "foil" ? "Foil" : "No Foil",
            condition: item.condition,
            price:
              Number(item.unitPrice) > 0
                ? `${Number(item.unitPrice).toLocaleString("vi-VN")} ₫`
                : "Liên hệ",
            imageUrl: item.imageUrl,
            glyph: "R",
            gradient: "from-[#91c6bd] via-[#477a78] to-[#283d54]",
            stock: Number(item.stock),
            quantity: Number(item.quantity),
          })),
        );
        setRemote(true);
      })
      .catch(() => {
        try {
          const saved = window.localStorage.getItem(storageKey);
          if (saved) setItems(JSON.parse(saved) as CartItem[]);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      });
    const sessionRequest = fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { user?: SessionUser | null }) => {
        const user = data.user ?? null;
        setSessionUser(user);
        setSessionState(
          user ? (user.isGuest ? "guest" : "authenticated") : "anonymous",
        );
      })
      .catch(() => {
        setSessionUser(null);
        setSessionState("error");
      });

    Promise.allSettled([cartRequest, sessionRequest]).then(() =>
      setReady(true),
    );
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (remote) {
      const revision = ++saveRevision.current;
      setSaveStatus("saving");
      const timer = window.setTimeout(() => {
        const snapshot = items;
        saveQueue.current = saveQueue.current
          .catch(() => undefined)
          .then(async () => {
            const response = await fetch("/api/cart", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: snapshot }),
            });
            if (!response.ok) throw new Error("Cart sync failed");
            if (revision === saveRevision.current) setSaveStatus("saved");
          })
          .catch(() => {
            if (revision === saveRevision.current) setSaveStatus("error");
          });
      }, 400);
      return () => window.clearTimeout(timer);
    } else {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
      setSaveStatus("saved");
    }
  }, [items, ready, remote]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((total, item) => total + item.quantity, 0),
      sessionUser,
      sessionState,
      setSessionUser: (user) => {
        setSessionUser(user);
        setSessionState(
          user ? (user.isGuest ? "guest" : "authenticated") : "anonymous",
        );
      },
      addItem: (item) =>
        setItems((current) => {
          const key = `${item.seller}:${item.cardId}`;
          const existing = current.find((entry) => entry.key === key);
          if (existing)
            return current.map((entry) =>
              entry.key === key
                ? {
                    ...entry,
                    quantity: Math.min(entry.quantity + 1, entry.stock),
                  }
                : entry,
            );
          return [...current, { ...item, key, quantity: 1 }];
        }),
      updateQuantity: (key, quantity) =>
        setItems((current) =>
          current
            .map((item) =>
              item.key === key
                ? {
                    ...item,
                    quantity: Math.max(0, Math.min(quantity, item.stock)),
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        ),
      removeItem: (key) =>
        setItems((current) => current.filter((item) => item.key !== key)),
      clear: () => setItems([]),
      saveStatus,
    }),
    [items, sessionUser, sessionState, saveStatus],
  );

  if (!ready) return <PageLoading />;

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
