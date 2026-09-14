"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Handshake,
  Minus,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageLoading } from "@/components/page-loading";
import { PageTitle } from "@/components/page-title";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { readGuestTrades, removeGuestTrade } from "@/lib/guest-trades";
import { CardImagePreview } from "@/components/card-image-preview";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast";

type TradeItem = {
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
};
type Trade = {
  id: string;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  completedAt: string | null;
  buyerContactPhone: string | null;
  buyer: string;
  buyerFacebookUrl: string | null;
  seller: string;
  sellerFacebookUrl: string | null;
  role: "buyer" | "seller";
  counterparty: string;
  counterpartyUsername: string;
  counterpartyFacebookUrl: string | null;
  counterpartyIsGuest: boolean;
  items: TradeItem[];
};

const statusLabel = {
  pending: "Đang chờ chốt",
  completed: "Đã giao dịch",
  cancelled: "Đã huỷ",
};

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { sessionState } = useCart();
  const toast = useToast();

  const load = useCallback(async (nextPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setLoadError("");
    const canReadGuestTrades =
      sessionState === "anonymous" || sessionState === "guest";
    const localTrades = canReadGuestTrades ? readGuestTrades() : [];
    try {
      const response = await fetch(`/api/trades?page=${nextPage}`);
      if (response.status === 401) {
        if (localTrades.length > 0) {
          setTrades(localTrades);
          return;
        }
        window.location.href = "/login?next=/trades";
        return;
      }
      const data = (await response.json().catch(() => null)) as {
        requests?: Trade[];
        page?: number;
        pages?: number;
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(data?.error ?? "Không thể tải danh sách giao dịch.");
      if (!data) throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
      const remoteTrades = data.requests ?? [];
      const remoteIds = new Set(remoteTrades.map((trade) => trade.id));
      const incoming = [
        ...remoteTrades,
        ...(nextPage === 1
          ? localTrades.filter((trade) => !remoteIds.has(trade.id))
          : []),
      ];
      setTrades((current) => {
        if (!append) return incoming;
        const currentIds = new Set(current.map((trade) => trade.id));
        return [...current, ...incoming.filter((trade) => !currentIds.has(trade.id))];
      });
      setPage(data.page ?? nextPage);
      setPages(Math.max(1, data.pages ?? 1));
    } catch (error) {
      if (localTrades.length > 0) setTrades(localTrades);
      else
        setLoadError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách giao dịch.",
        );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sessionState]);
  useEffect(() => {
    void load();
  }, [load]);

  const changeQuantity = (tradeId: string, itemId: string, quantity: number) =>
    setTrades((current) =>
      current.map((trade) =>
        trade.id !== tradeId
          ? trade
          : {
              ...trade,
              items: trade.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      quantity: Math.max(1, Math.min(quantity, item.stock)),
                    },
              ),
            },
      ),
    );
  const act = async (
    trade: Trade,
    action: "update" | "complete" | "cancel",
  ) => {
    setBusy(`${trade.id}:${action}`);
    try {
      if (action === "complete") {
        const saveResponse = await fetch(`/api/trades/${trade.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            items: trade.items.map(({ id, quantity }) => ({ id, quantity })),
          }),
        });
        if (!saveResponse.ok) {
          const saveData = (await saveResponse.json().catch(() => ({}))) as {
            error?: string;
          };
          toast({
            title:
              saveData.error ??
              "Không thể lưu số lượng trước khi đánh dấu đã giao dịch.",
            variant: "error",
          });
          return;
        }
      }
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          items: trade.items.map(({ id, quantity }) => ({ id, quantity })),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        toast({
          title: data.error ?? "Không thể cập nhật giao dịch.",
          variant: "error",
        });
      else {
        toast({
          title:
            action === "complete"
              ? "Đã giao dịch và cập nhật số lượng collection."
              : action === "cancel"
                ? "Đã huỷ yêu cầu."
                : "Đã lưu thay đổi.",
          variant: "success",
        });
        await load();
      }
    } catch {
      toast({
        title: "Không thể kết nối để cập nhật giao dịch.",
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  const deleteTrade = async (trade: Trade) => {
    if (
      !window.confirm(
        "Ẩn giao dịch này khỏi danh sách của bạn? Phía còn lại vẫn có thể xem giao dịch.",
      )
    )
      return;
    setBusy(`${trade.id}:delete`);
    try {
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        toast({
          title: data.error ?? "Không thể ẩn giao dịch.",
          variant: "error",
        });
      else {
        removeGuestTrade(trade.id);
        setTrades((current) => current.filter((item) => item.id !== trade.id));
        toast({
          title: "Đã ẩn giao dịch khỏi danh sách của bạn.",
          variant: "success",
        });
      }
    } catch {
      toast({ title: "Không thể kết nối để ẩn giao dịch.", variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <PageLoading />;
  return (
    <main className="paper-grid min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-8 lg:py-7">
        <SiteHeader />
        <div className="py-5 sm:py-7">
          <PageTitle icon={Handshake}>Giao dịch</PageTitle>
          <p className="mt-1 text-sm text-muted-foreground sm:text-xs">
            Yêu cầu mua và bán của bạn
          </p>
        </div>
        {loadError ? (
          <EmptyState
            icon={XCircle}
            title="Không thể tải giao dịch"
            description={loadError}
            variant="error"
            className="min-h-64 max-sm:[&>div]:p-5 max-sm:[&_p]:text-sm"
          >
            <Button
              className="mt-4 min-h-11 w-full text-sm sm:min-h-0 sm:w-auto sm:text-xs"
              size="sm"
              onClick={() => void load()}
            >
              Thử lại
            </Button>
          </EmptyState>
        ) : trades.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="Chưa có yêu cầu giao dịch"
            description="Chọn card trong collection của người khác và gửi từ giỏ hàng."
            className="min-h-64 max-sm:[&>div]:p-5 max-sm:[&_p]:text-sm"
          />
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => {
              const isSeller = trade.role === "seller";
              const other = trade.counterparty;
              const facebookUrl = trade.counterpartyFacebookUrl;
              const editable = isSeller && trade.status === "pending";
              const total = trade.items.reduce(
                (sum, item) => sum + Number(item.unitPrice) * item.quantity,
                0,
              );
              const totalQuantity = trade.items.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );
              return (
                <Card key={trade.id} className="overflow-hidden">
                  <div className="flex items-start justify-between gap-3 border-b bg-card/80 px-3 py-3 sm:items-center sm:px-4">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
                        {isSeller ? "Yêu cầu mua từ" : "Gửi tới"}
                      </span>
                      <div className="flex min-w-0 items-center gap-2">
                        {trade.counterpartyIsGuest ? (
                          <strong className="min-w-0 truncate">{other}</strong>
                        ) : (
                          <Link
                            href={`/u/${trade.counterpartyUsername}`}
                            className="min-w-0 truncate py-1 text-base font-bold hover:underline sm:py-0 sm:text-sm"
                          >
                            {other}
                          </Link>
                        )}
                        {facebookUrl && (
                          <a
                            href={facebookUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="grid size-10 shrink-0 place-items-center rounded-sm border bg-card text-sm font-black text-primary transition-colors hover:bg-secondary sm:size-6 sm:text-[10px]"
                            aria-label={`Mở Facebook của ${other}`}
                            title="Mở Facebook"
                          >
                            f
                          </a>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold sm:py-1 sm:text-[9px] ${trade.status === "completed" ? "bg-[#dce9ca] text-[#426026]" : trade.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
                    >
                      {statusLabel[trade.status]}
                    </span>
                  </div>
                  <div className="divide-y">
                    {trade.items.map((item) => (
                      <div
                        key={item.id}
                        className="relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-3 py-3 sm:flex sm:items-center sm:px-4"
                      >
                        <CardImagePreview
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-24 aspect-[469/655] sm:h-16"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-base leading-5 font-bold sm:truncate sm:text-xs sm:leading-4">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground sm:mt-0 sm:text-[9px] sm:leading-normal">
                            {item.set} · {String(item.number).padStart(3, "0")}{" "}
                            · {item.finish === "foil" ? "Foil" : "Thường"} ·{" "}
                            {item.condition}
                          </p>
                          <p className="mt-1 text-sm font-semibold sm:text-[10px]">
                            {Number(item.unitPrice)
                              ? formatCurrency(Number(item.unitPrice))
                              : "Liên hệ"}
                          </p>
                        </div>
                        {editable ? (
                          <div className="col-span-2 flex w-full items-center rounded-sm border bg-background sm:col-span-1 sm:w-auto">
                            <button
                              className="grid size-11 shrink-0 place-items-center disabled:opacity-30 sm:size-7"
                              aria-label={`Giảm số lượng ${item.name}`}
                              disabled={item.quantity <= 1}
                              onClick={() =>
                                changeQuantity(
                                  trade.id,
                                  item.id,
                                  item.quantity - 1,
                                )
                              }
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="min-w-10 flex-1 text-center text-sm font-bold sm:w-7 sm:min-w-0 sm:flex-none sm:text-[10px]">
                              {item.quantity}
                            </span>
                            <button
                              className="grid size-11 shrink-0 place-items-center disabled:opacity-30 sm:size-7"
                              aria-label={`Tăng số lượng ${item.name}`}
                              disabled={item.quantity >= item.stock}
                              onClick={() =>
                                changeQuantity(
                                  trade.id,
                                  item.id,
                                  item.quantity + 1,
                                )
                              }
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        ) : (
                          <strong className="absolute right-3 text-sm sm:static sm:text-xs">
                            ×{item.quantity}
                          </strong>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 border-t bg-secondary/30 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm sm:block sm:text-xs">
                      <strong>{totalQuantity} lá</strong>
                      <span className="mx-1.5 text-muted-foreground">·</span>
                      Tổng tạm tính: <strong>{formatCurrency(total)}</strong>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                      {trade.status === "pending" && (
                        <>
                          {editable && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="min-h-11 text-sm sm:min-h-0 sm:text-xs"
                              disabled={busy !== null}
                              onClick={() => act(trade, "update")}
                            >
                              Lưu chỉnh sửa
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-11 border-destructive/50 text-sm text-destructive hover:border-destructive hover:bg-destructive/10 sm:min-h-0 sm:text-xs"
                            disabled={busy !== null}
                            onClick={() => act(trade, "cancel")}
                          >
                            <XCircle className="size-3.5" /> Huỷ
                          </Button>
                          {editable && (
                            <Button
                              size="sm"
                              className="col-span-2 min-h-11 text-sm sm:col-span-1 sm:min-h-0 sm:text-xs"
                              disabled={busy !== null}
                              onClick={() => act(trade, "complete")}
                            >
                              <CheckCircle2 className="size-3.5" /> Đã giao dịch
                            </Button>
                          )}
                        </>
                      )}
                      {trade.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="col-span-2 min-h-11 whitespace-normal text-sm text-muted-foreground hover:text-destructive sm:col-span-1 sm:min-h-0 sm:text-xs"
                          disabled={busy !== null}
                          onClick={() => void deleteTrade(trade)}
                        >
                          <Trash2 className="size-3.5" /> Ẩn giao dịch đã hoàn
                          thành
                        </Button>
                      )}
                    </div>
                  </div>
                  {trade.buyerContactPhone && (
                    <div className="border-t bg-[#edf3e5] px-3 py-3 text-sm sm:px-4 sm:py-2 sm:text-xs">
                      SĐT liên hệ:{" "}
                      <a
                        className="font-bold hover:underline"
                        href={`tel:${trade.buyerContactPhone}`}
                      >
                        {trade.buyerContactPhone}
                      </a>
                    </div>
                  )}
                </Card>
              );
            })}
            {page < pages && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  className="min-h-11 w-full sm:w-auto"
                  disabled={loadingMore}
                  onClick={() => void load(page + 1, true)}
                >
                  {loadingMore ? "Đang tải..." : "Xem thêm giao dịch"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
