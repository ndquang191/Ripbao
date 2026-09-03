"use client";

import Link from "next/link";
import { CheckCircle2, Handshake, Minus, Plus, Trash2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AccountLink } from "@/components/account-link";
import { PageLoading } from "@/components/page-loading";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/components/toast";

type TradeItem = { id: string; cardId: string; name: string; set: string; number: number; imageUrl: string; finish: string; condition: string; quantity: number; unitPrice: number; stock: number };
type Trade = { id: string; status: "pending" | "completed" | "cancelled"; createdAt: string; completedAt: string | null; buyerContactPhone: string | null; buyer: string; buyerFacebookUrl: string | null; seller: string; sellerFacebookUrl: string | null; role: "buyer" | "seller"; counterparty: string; counterpartyUsername: string; counterpartyFacebookUrl: string | null; counterpartyIsGuest: boolean; items: TradeItem[] };

const statusLabel = { pending: "Đang chờ chốt", completed: "Đã giao dịch", cancelled: "Đã huỷ" };

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const response = await fetch("/api/trades");
    if (response.status === 401) { window.location.href = "/login?next=/trades"; return; }
    const data = await response.json() as { requests?: Trade[]; username?: string };
    setTrades(data.requests ?? []); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const changeQuantity = (tradeId: string, itemId: string, quantity: number) => setTrades((current) => current.map((trade) => trade.id !== tradeId ? trade : { ...trade, items: trade.items.map((item) => item.id !== itemId ? item : { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }) }));
  const act = async (trade: Trade, action: "update" | "complete" | "cancel") => {
    setBusy(`${trade.id}:${action}`);
    if (action === "complete") {
      const saveResponse = await fetch(`/api/trades/${trade.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", items: trade.items.map(({ id, quantity }) => ({ id, quantity })) }) });
      if (!saveResponse.ok) {
        const saveData = await saveResponse.json() as { error?: string };
        toast({ title: saveData.error ?? "Không thể lưu số lượng trước khi đánh dấu đã giao dịch.", variant: "error" }); setBusy(null); return;
      }
    }
    const response = await fetch(`/api/trades/${trade.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, items: trade.items.map(({ id, quantity }) => ({ id, quantity })) }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) toast({ title: data.error ?? "Không thể cập nhật giao dịch.", variant: "error" });
    else { toast({ title: action === "complete" ? "Đã giao dịch và cập nhật số lượng collection." : action === "cancel" ? "Đã huỷ yêu cầu." : "Đã lưu thay đổi.", variant: "success" }); await load(); }
    setBusy(null);
  };

  const deleteTrade = async (trade: Trade) => {
    if (!window.confirm("Xoá giao dịch này? Giao dịch sẽ biến mất với cả hai bên.")) return;
    setBusy(`${trade.id}:delete`);
    const response = await fetch(`/api/trades/${trade.id}`, { method: "DELETE" });
    const data = await response.json() as { error?: string };
    if (!response.ok) toast({ title: data.error ?? "Không thể xoá giao dịch.", variant: "error" });
    else {
      setTrades((current) => current.filter((item) => item.id !== trade.id));
      toast({ title: "Đã xoá giao dịch.", variant: "success" });
    }
    setBusy(null);
  };

  if (loading) return <PageLoading />;
  return <main className="paper-grid min-h-dvh"><div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 lg:py-7">
    <header className="flex items-center justify-between border-b pb-5"><Link href="/" className="flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]"><span className="grid h-9 w-8 place-items-center rounded-sm border-2 border-accent bg-primary font-serif text-lg text-accent">R</span> RIPBAO</Link><AccountLink /></header>
    <div className="py-7"><PageTitle icon={Handshake}>Giao dịch</PageTitle><p className="mt-1 text-xs text-muted-foreground">Yêu cầu mua và bán của bạn</p></div>
    {trades.length === 0 ? <Card className="grid min-h-64 place-items-center border-dashed bg-card/70 p-8 text-center"><div><Handshake className="mx-auto size-8 text-muted-foreground"/><h2 className="mt-3 font-serif text-lg font-semibold">Chưa có yêu cầu giao dịch</h2><p className="mt-1 text-xs text-muted-foreground">Chọn card trong collection của người khác và gửi từ giỏ hàng.</p></div></Card> : <div className="space-y-4">{trades.map((trade) => {
      const isSeller = trade.role === "seller"; const other = trade.counterparty; const facebookUrl = trade.counterpartyFacebookUrl; const editable = isSeller && trade.status === "pending"; const total = trade.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0); const totalQuantity = trade.items.reduce((sum, item) => sum + item.quantity, 0);
      return <Card key={trade.id} className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b bg-card/80 px-4 py-3"><div><span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">{isSeller ? "Yêu cầu mua từ" : "Gửi tới"}</span><div className="flex items-center gap-1.5">{trade.counterpartyIsGuest ? <strong>{other}</strong> : <Link href={`/u/${trade.counterpartyUsername}`} className="font-bold hover:underline">@{trade.counterpartyUsername}</Link>}{facebookUrl && <a href={facebookUrl} target="_blank" rel="noreferrer" className="grid size-6 place-items-center rounded-sm border bg-card text-[10px] font-black text-primary transition-colors hover:bg-secondary" aria-label={`Mở Facebook của ${other}`} title="Mở Facebook">f</a>}</div></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${trade.status === "completed" ? "bg-[#dce9ca] text-[#426026]" : trade.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{statusLabel[trade.status]}</span></div>
      <div className="divide-y">{trade.items.map((item) => <div key={item.id} className="flex items-center gap-3 px-4 py-3"><div className="h-16 aspect-[469/655] shrink-0 overflow-hidden rounded-sm border bg-secondary">{item.imageUrl && <img src={item.imageUrl} alt="" className="size-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.name}</p><p className="text-[9px] text-muted-foreground">{item.set} · {String(item.number).padStart(3, "0")} · {item.finish === "foil" ? "Foil" : "No Foil"} · {item.condition}</p><p className="mt-1 text-[10px] font-semibold">{Number(item.unitPrice) ? formatCurrency(Number(item.unitPrice)) : "Liên hệ"}</p></div>{editable ? <div className="flex items-center rounded-sm border"><button className="grid size-7 place-items-center disabled:opacity-30" disabled={item.quantity <= 1} onClick={() => changeQuantity(trade.id, item.id, item.quantity - 1)}><Minus className="size-3"/></button><span className="w-7 text-center text-[10px] font-bold">{item.quantity}</span><button className="grid size-7 place-items-center disabled:opacity-30" disabled={item.quantity >= item.stock} onClick={() => changeQuantity(trade.id, item.id, item.quantity + 1)}><Plus className="size-3"/></button></div> : <strong className="text-xs">×{item.quantity}</strong>}</div>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-secondary/30 px-4 py-3"><div className="text-xs"><strong>{totalQuantity} lá</strong><span className="mx-1.5 text-muted-foreground">·</span>Tổng tạm tính: <strong>{formatCurrency(total)}</strong></div><div className="flex flex-wrap gap-2">{trade.status === "pending" && <>{editable && <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => act(trade, "update")}>Lưu chỉnh sửa</Button>}<Button variant="ghost" size="sm" className="text-destructive" disabled={busy !== null} onClick={() => act(trade, "cancel")}><XCircle className="size-3.5"/> Huỷ</Button>{editable && <Button size="sm" disabled={busy !== null} onClick={() => act(trade, "complete")}><CheckCircle2 className="size-3.5"/> Đã giao dịch</Button>}</>}<Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" disabled={busy !== null} onClick={() => void deleteTrade(trade)}><Trash2 className="size-3.5" /> Xoá</Button></div></div>
      {trade.buyerContactPhone && <div className="border-t bg-[#edf3e5] px-4 py-2 text-xs">SĐT liên hệ: <a className="font-bold hover:underline" href={`tel:${trade.buyerContactPhone}`}>{trade.buyerContactPhone}</a></div>}
      </Card>})}</div>}
  </div></main>;
}
