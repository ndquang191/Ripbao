"use client";

import Link from "next/link";
import { Check, Copy, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { type CartItem, useCart } from "@/components/cart-provider";
import { CardImagePreview } from "@/components/card-image-preview";
import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/page-title";
import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrency } from "@/lib/currency";
import { saveGuestTrade } from "@/lib/guest-trades";
import { useToast } from "@/components/toast";
import { useModalDialog } from "@/app/collection/_hooks/use-modal-dialog";

export default function CartPage() {
  const {
    items,
    sessionUser,
    setSessionUser,
    updateQuantity,
    removeItem,
  } = useCart();
  const [copiedSeller, setCopiedSeller] = useState<string | null>(null);
  const [sendingSellers, setSendingSellers] = useState<Set<string>>(
    () => new Set(),
  );
  const toast = useToast();
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [pendingItems, setPendingItems] = useState<typeof items>([]);
  const [quantityLimitKey, setQuantityLimitKey] = useState<string | null>(null);
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const [sellerToClear, setSellerToClear] = useState<{
    displayName: string;
    items: CartItem[];
  } | null>(null);
  const quantityLimitTimer = useRef<number | null>(null);
  const guestDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!guestDialogOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = guestDialogRef.current;
    panel?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setGuestDialogOpen(false);
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], [tabindex="0"]',
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [guestDialogOpen]);

  useEffect(() => {
    return () => {
      if (quantityLimitTimer.current) {
        window.clearTimeout(quantityLimitTimer.current);
      }
    };
  }, []);

  const groups = Object.entries(
    items.reduce<Record<string, typeof items>>((result, item) => {
      (result[item.seller] ??= []).push(item);
      return result;
    }, {}),
  );
  const sendRequest = async (requestItems: typeof items) => {
    const seller = requestItems[0]?.seller;
    const sellerDisplayName = requestItems[0]?.sellerDisplayName || "Người bán";
    if (!seller) return;
    setSendingSellers((current) => new Set(current).add(seller));
    setGuestDialogOpen(false);
    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: requestItems }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        ids?: string[];
        user?: typeof sessionUser;
      };
      if (!response.ok) {
        toast({
          title: data.error ?? "Không thể gửi yêu cầu.",
          variant: "error",
        });
        return;
      }
      if (data.user?.isGuest === true) {
        const tradeId = String(data.ids?.[0] ?? `local-${Date.now()}`);
        const sellerFacebookUrl =
          requestItems.find((item) => item.sellerFacebookUrl)
            ?.sellerFacebookUrl ?? null;
        saveGuestTrade({
          id: tradeId,
          status: "pending",
          createdAt: new Date().toISOString(),
          completedAt: null,
          buyerContactPhone: null,
          buyer: data.user?.username ?? "guest",
          buyerFacebookUrl: null,
          seller,
          sellerFacebookUrl,
          role: "buyer",
          counterparty: sellerDisplayName,
          counterpartyUsername: seller,
          counterpartyFacebookUrl: sellerFacebookUrl,
          counterpartyIsGuest: false,
          items: requestItems.map((item, index) => ({
            id: `${tradeId}:${index}`,
            cardId: item.cardId,
            name: item.name,
            set: item.set,
            number: Number.parseInt(item.number, 10) || 0,
            imageUrl: item.imageUrl ?? "",
            finish: item.finish.toLowerCase() === "foil" ? "foil" : "nonfoil",
            condition: item.condition,
            quantity: item.quantity,
            unitPrice: parseCurrency(item.price) ?? 0,
            stock: item.stock,
          })),
        });
      }
      if (data.user) setSessionUser(data.user);
      requestItems.forEach((item) => removeItem(item.key));
      setPendingItems([]);
      toast({
        title: `Đã gửi yêu cầu đến ${sellerDisplayName}.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Không thể kết nối để gửi yêu cầu. Vui lòng thử lại.",
        variant: "error",
      });
    } finally {
      setSendingSellers((current) => {
        const next = new Set(current);
        next.delete(seller);
        return next;
      });
    }
  };
  const requestFromSeller = (sellerItems: typeof items) => {
    if (sessionUser && !sessionUser.isGuest) {
      void sendRequest(sellerItems);
      return;
    }
    setPendingItems(sellerItems);
    setGuestDialogOpen(true);
  };
  const changeQuantity = (key: string, quantity: number) => {
    updateQuantity(key, quantity);
    setQuantityLimitKey(key);
    if (quantityLimitTimer.current)
      window.clearTimeout(quantityLimitTimer.current);
    quantityLimitTimer.current = window.setTimeout(
      () => setQuantityLimitKey(null),
      1200,
    );
  };

  return (
    <main className="paper-grid min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-8 sm:py-5 lg:py-7">
        <SiteHeader />

        <div className="flex flex-col items-start gap-1.5 py-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:py-7">
          <div>
            <PageTitle icon={ShoppingBag}>Giỏ hàng</PageTitle>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Giỏ hàng đang trống"
            description="Khám phá các collection và chọn card bạn thích."
            className="min-h-56 max-sm:[&>div]:p-4 max-sm:[&_p]:text-xs sm:min-h-72"
          >
            <Link
              href="/"
              className={cn(
                buttonVariants({ size: "sm" }),
                "mt-4 min-h-10 w-full text-xs sm:mt-5 sm:min-h-0 sm:w-auto",
              )}
            >
              Khám phá collection
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-3 sm:space-y-5">
            {groups.map(([seller, sellerItems]) => {
              const pricedItems = sellerItems.map((item) => ({
                item,
                unitPrice: parseCurrency(item.price),
              }));
              const sellerTotal = pricedItems.reduce(
                (total, { item, unitPrice }) =>
                  total + (unitPrice ?? 0) * item.quantity,
                0,
              );
              const sellerCount = sellerItems.reduce(
                (total, item) => total + item.quantity,
                0,
              );
              const sellerFacebookUrl = sellerItems.find(
                (item) => item.sellerFacebookUrl,
              )?.sellerFacebookUrl;
              const sellerDisplayName =
                sellerItems[0]?.sellerDisplayName || "Người bán";
              const needsQuote = pricedItems.some(
                ({ unitPrice }) => unitPrice === null,
              );
              const copyCards = async () => {
                const lines = sellerItems.map((item) => {
                  const unitPrice = parseCurrency(item.price);
                  const subtotal =
                    unitPrice === null
                      ? "Liên hệ"
                      : formatCurrency(unitPrice * item.quantity);
                  return `${item.quantity}x ${item.name} — ${item.set} ${item.number} — ${subtotal}`;
                });
                lines.push(
                  `Tổng: ${formatCurrency(sellerTotal)}${needsQuote ? " + card cần báo giá" : ""}`,
                );
                try {
                  await navigator.clipboard.writeText(
                    `${sellerDisplayName}\n${lines.join("\n")}`,
                  );
                } catch {
                  toast({
                    title: "Không thể sao chép. Vui lòng thử lại.",
                    variant: "error",
                  });
                  return;
                }
                setCopiedSeller(seller);
                toast({
                  title: `Đã sao chép danh sách card của ${sellerDisplayName}.`,
                  variant: "success",
                });
                window.setTimeout(
                  () =>
                    setCopiedSeller((current) =>
                      current === seller ? null : current,
                    ),
                  1600,
                );
              };

              return (
                <section
                  key={seller}
                  className="overflow-hidden rounded-md border bg-card/55 shadow-sm sm:overflow-visible sm:rounded-none sm:border-x-0 sm:border-t-0 sm:bg-transparent sm:pb-5 sm:shadow-none"
                >
                  <div className="flex items-center justify-between gap-2 border-b bg-card/80 px-2.5 py-1.5 sm:mb-2 sm:flex-wrap sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-1.5">
                      <Link
                        href={`/u/${encodeURIComponent(seller)}`}
                        className="min-w-0 truncate py-1 text-sm font-bold hover:text-[#5f793f] hover:underline sm:py-0 sm:text-base"
                      >
                        {sellerDisplayName}
                      </Link>
                      {sellerFacebookUrl && (
                        <a
                          href={sellerFacebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="grid size-8 shrink-0 place-items-center rounded-sm border bg-card text-xs font-black text-primary transition-colors hover:bg-secondary sm:size-6 sm:text-[10px]"
                          aria-label={`Mở Facebook của ${sellerDisplayName} để nhắn tin`}
                          title="Mở Facebook để nhắn tin"
                        >
                          f
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden text-[10px] text-muted-foreground sm:inline">
                        {sellerCount} card · Tổng:{" "}
                        <strong className="text-foreground">
                          {formatCurrency(sellerTotal)}
                        </strong>
                        {needsQuote && " + báo giá"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-[10px] sm:h-7 sm:text-[9px]"
                        onClick={copyCards}
                      >
                        {copiedSeller === seller ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        {copiedSeller === seller ? "Đã copy" : "Copy"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:size-7"
                        onClick={() =>
                          setSellerToClear({
                            displayName: sellerDisplayName,
                            items: sellerItems,
                          })
                        }
                        aria-label={`Xoá card từ collection của ${sellerDisplayName}`}
                        title="Xoá collection khỏi giỏ"
                      >
                        <Trash2 className="size-3.5 sm:size-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 divide-y px-2.5 sm:grid-cols-2 sm:gap-2.5 sm:divide-y-0 sm:px-0 md:grid-cols-3 lg:grid-cols-4">
                    {sellerItems.map((item) => {
                      const unitPrice = parseCurrency(item.price);
                      return (
                        <Card
                          key={item.key}
                          className="min-w-0 rounded-none border-0 bg-transparent px-0 py-2 shadow-none sm:relative sm:overflow-hidden sm:rounded-lg sm:border sm:bg-card sm:p-2.5 sm:shadow-sm"
                        >
                          <div className="flex min-w-0 gap-2.5">
                            <CardImagePreview
                              src={item.imageUrl}
                              alt={item.name}
                              className={cn(
                                "relative grid h-24 aspect-[469/655] place-items-center rounded-[5px] border-2 border-[#bca66e] bg-gradient-to-br sm:h-20",
                                item.gradient,
                              )}
                              imageClassName="absolute inset-0"
                            />
                            <div className="flex min-w-0 flex-1 flex-col pt-0.5 sm:block">
                              <div className="flex min-w-0 items-start justify-between gap-1">
                                <h2 className="min-w-0 text-sm leading-5 font-bold [overflow-wrap:anywhere] sm:mt-1 sm:truncate sm:pr-5 sm:text-xs sm:leading-4">
                                  {item.name}
                                </h2>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="-mt-1.5 -mr-1.5 size-8 shrink-0 rounded-sm text-muted-foreground hover:text-destructive sm:absolute sm:top-1 sm:right-1 sm:z-10 sm:mt-0 sm:mr-0 sm:size-6 sm:bg-card/85 sm:shadow-sm sm:backdrop-blur"
                                  onClick={() => setItemToRemove(item)}
                                  aria-label={`Xoá ${item.name}`}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                              <p className="mt-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase [overflow-wrap:anywhere] sm:mt-0 sm:truncate sm:pr-5 sm:text-[8px]">
                                {item.set} · {item.number}
                              </p>
                              <span className="mt-auto block pt-2 text-xs text-muted-foreground [overflow-wrap:anywhere] sm:mt-3 sm:pt-0 sm:text-[9px]">
                                {unitPrice === null
                                  ? item.price
                                  : formatCurrency(unitPrice)}{" "}
                                / lá
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2 sm:flex-nowrap sm:gap-0 sm:pt-1.5">
                            <strong className="text-sm sm:text-xs">
                              {unitPrice === null
                                ? "Liên hệ"
                                : formatCurrency(unitPrice * item.quantity)}
                            </strong>
                            <div className="flex items-center rounded-sm border bg-background p-px">
                              <button
                                type="button"
                                className="grid size-8 shrink-0 place-items-center rounded-sm hover:bg-secondary disabled:opacity-30 sm:size-4.5"
                                disabled={item.quantity <= 1}
                                onClick={() =>
                                  changeQuantity(item.key, item.quantity - 1)
                                }
                                aria-label="Giảm số lượng"
                              >
                                <Minus className="size-3 sm:size-2.5" />
                              </button>
                              <span className="min-w-8 px-1 text-center text-xs font-black sm:w-7 sm:min-w-0 sm:px-0 sm:text-[8px]">
                                {item.quantity}
                                {quantityLimitKey === item.key &&
                                  `/${item.stock}`}
                              </span>
                              <button
                                type="button"
                                className="grid size-8 shrink-0 place-items-center rounded-sm hover:bg-secondary disabled:opacity-30 sm:size-4.5"
                                disabled={item.quantity >= item.stock}
                                onClick={() =>
                                  changeQuantity(item.key, item.quantity + 1)
                                }
                                aria-label="Tăng số lượng"
                              >
                                <Plus className="size-3 sm:size-2.5" />
                              </button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  <div className="flex flex-col gap-2 border-t bg-card/80 p-2.5 sm:mt-4 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs sm:hidden">
                      <span className="text-muted-foreground">
                        {sellerCount} card
                      </span>
                      <div className="min-w-0 text-right">
                        <span>
                          Tổng:{" "}
                          <strong className="text-sm">
                            {formatCurrency(sellerTotal)}
                          </strong>
                        </span>
                        {needsQuote && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                            + card cần báo giá
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      className="h-10 w-full text-xs sm:w-auto sm:text-sm"
                      aria-label={`Gửi yêu cầu đến ${sellerDisplayName}`}
                      disabled={sendingSellers.has(seller)}
                      onClick={() => requestFromSeller(sellerItems)}
                    >
                      {sendingSellers.has(seller) ? (
                        "Đang gửi..."
                      ) : (
                        <>
                          <span className="sm:hidden">Gửi yêu cầu</span>
                          <span className="hidden sm:inline">
                            Gửi yêu cầu đến {sellerDisplayName}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
      {guestDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-primary/40 backdrop-blur-[1px]"
            onClick={() => setGuestDialogOpen(false)}
            aria-label="Đóng"
            tabIndex={-1}
            aria-hidden="true"
          />
          <Card
            ref={guestDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-contact-title"
            aria-describedby="guest-contact-description"
            className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain p-4 shadow-2xl sm:p-6"
          >
            <button
              type="button"
              className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-sm hover:bg-secondary"
              onClick={() => setGuestDialogOpen(false)}
              aria-label="Đóng"
            >
              <X className="size-4" />
            </button>
            <h2
              id="guest-contact-title"
              className="pr-9 font-serif text-base font-semibold [overflow-wrap:anywhere] sm:pr-8 sm:text-lg"
            >
              Gửi yêu cầu đến{" "}
              {pendingItems[0]?.sellerDisplayName || "người bán"}
            </h2>
            <p
              id="guest-contact-description"
              className="mt-2 text-xs leading-5 text-muted-foreground"
            >
              Bạn có muốn tạo tài khoản để theo dõi và quản lý các yêu cầu mua
              dễ dàng hơn không? Nếu tiếp tục với tư cách khách, bạn sẽ cần chủ
              động liên lạc với người bán.
            </p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:mt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="min-h-10 whitespace-normal text-xs"
                disabled={sendingSellers.has(pendingItems[0]?.seller ?? "")}
                onClick={() => void sendRequest(pendingItems)}
              >
                Tôi sẽ chủ động liên lạc
              </Button>
              <Link
                href="/register?next=/cart"
                className={cn(buttonVariants(), "min-h-10 text-xs")}
                onClick={() => setGuestDialogOpen(false)}
              >
                Tạo tài khoản
              </Link>
            </div>
          </Card>
        </div>
      )}
      {itemToRemove && (
        <ConfirmDeleteDialog
          title="Xoá khỏi giỏ?"
          description={itemToRemove.name}
          cancel={() => setItemToRemove(null)}
          confirm={() => {
            removeItem(itemToRemove.key);
            setItemToRemove(null);
          }}
        />
      )}
      {sellerToClear && (
        <ConfirmDeleteDialog
          title={`Xoá card của ${sellerToClear.displayName}?`}
          description={`${sellerToClear.items.reduce((total, item) => total + item.quantity, 0)} card thuộc collection này sẽ bị xoá khỏi giỏ hàng.`}
          confirmLabel="Xoá collection"
          cancel={() => setSellerToClear(null)}
          confirm={() => {
            sellerToClear.items.forEach((item) => removeItem(item.key));
            setSellerToClear(null);
          }}
        />
      )}
    </main>
  );
}

function ConfirmDeleteDialog({
  title,
  description,
  confirmLabel = "Xoá",
  cancel,
  confirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancel: () => void;
  confirm: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useModalDialog(dialogRef, cancel);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-primary/35 backdrop-blur-[1px]"
        onClick={cancel}
        aria-label="Huỷ xoá sản phẩm"
      />
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-xs rounded-sm border bg-card p-4 shadow-2xl outline-none"
      >
        <h2 id={titleId} className="font-serif text-base font-semibold">
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mt-1.5 text-xs leading-5 text-muted-foreground"
        >
          {description}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={cancel}>
            Huỷ
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-destructive text-white hover:bg-destructive/85"
            onClick={confirm}
          >
            <Trash2 className="size-3.5" />
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
