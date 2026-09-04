"use client";

import Link from "next/link";
import { Check, Copy, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { AccountLink } from "@/components/account-link";
import { BrandLogo } from "@/components/brand-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/page-title";
import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrency } from "@/lib/currency";
import { saveGuestTrade } from "@/lib/guest-trades";
import { useToast } from "@/components/toast";

export default function CartPage() {
	const { items, count, sessionUser, setSessionUser, updateQuantity, removeItem, clear, saveStatus } = useCart();
	const [copiedSeller, setCopiedSeller] = useState<string | null>(null);
	const [sendingSellers, setSendingSellers] = useState<Set<string>>(() => new Set());
	const toast = useToast();
	const [guestDialogOpen, setGuestDialogOpen] = useState(false);
	const [pendingItems, setPendingItems] = useState<typeof items>([]);
	const [quantityLimitKey, setQuantityLimitKey] = useState<string | null>(null);
	const quantityLimitTimer = useRef<number | null>(null);
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
			const data = await response.json().catch(() => ({})) as { error?: string; ids?: string[]; user?: typeof sessionUser };
			if (!response.ok) {
				toast({ title: data.error ?? "Không thể gửi yêu cầu.", variant: "error" });
				return;
			}
			if (data.user?.isGuest === true) {
				const tradeId = String(data.ids?.[0] ?? `local-${Date.now()}`);
				const sellerFacebookUrl = requestItems.find((item) => item.sellerFacebookUrl)?.sellerFacebookUrl ?? null;
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
			toast({ title: `Đã gửi yêu cầu đến ${sellerDisplayName}.`, variant: "success" });
		} catch {
			toast({ title: "Không thể kết nối để gửi yêu cầu. Vui lòng thử lại.", variant: "error" });
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
		if (quantityLimitTimer.current) window.clearTimeout(quantityLimitTimer.current);
		quantityLimitTimer.current = window.setTimeout(() => setQuantityLimitKey(null), 1200);
	};

	return (
		<main className="paper-grid min-h-dvh">
			<div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 lg:py-7">
				<header className="flex items-center justify-between border-b pb-5">
					<Link
						href="/"
						className="flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]"
					>
						<BrandLogo />{" "}
						RIPBAO
					</Link>
					<AccountLink />
				</header>

				<div className="flex items-end justify-between gap-4 py-7">
					<div>
						<PageTitle icon={ShoppingBag}>Giỏ hàng</PageTitle>
						<p className="mt-1 text-xs text-muted-foreground">
							{count} card từ {groups.length} collection
							{saveStatus === "saving" && " · Đang lưu…"}
							{saveStatus === "error" && <span className="text-destructive"> · Lưu giỏ hàng thất bại</span>}
						</p>
					</div>
					{items.length > 0 && (
						<Button variant="ghost" size="sm" onClick={clear} className="text-destructive">
							<Trash2 className="size-3.5" /> Xoá giỏ hàng
						</Button>
					)}
				</div>

				{items.length === 0 ? (
					<Card className="grid min-h-72 place-items-center border-dashed bg-card/70 p-8 text-center">
						<div>
							<ShoppingBag className="mx-auto size-8 text-muted-foreground" />
							<h2 className="mt-4 font-serif text-xl font-semibold">Giỏ hàng đang trống</h2>
							<p className="mt-1 text-xs text-muted-foreground">
								Khám phá các collection và chọn card bạn thích.
							</p>
							<Link href="/" className={cn(buttonVariants({ size: "sm" }), "mt-5")}>
								Khám phá collection
							</Link>
						</div>
					</Card>
				) : (
					<div className="space-y-5">
						{groups.map(([seller, sellerItems]) => {
							const pricedItems = sellerItems.map((item) => ({
								item,
								unitPrice: parseCurrency(item.price),
							}));
							const sellerTotal = pricedItems.reduce(
								(total, { item, unitPrice }) => total + (unitPrice ?? 0) * item.quantity,
								0,
							);
							const sellerCount = sellerItems.reduce((total, item) => total + item.quantity, 0);
							const sellerFacebookUrl = sellerItems.find(
								(item) => item.sellerFacebookUrl,
							)?.sellerFacebookUrl;
							const sellerDisplayName = sellerItems[0]?.sellerDisplayName || "Người bán";
							const needsQuote = pricedItems.some(({ unitPrice }) => unitPrice === null);
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
								await navigator.clipboard.writeText(`${sellerDisplayName}\n${lines.join("\n")}`);
								setCopiedSeller(seller);
								toast({
									title: `Đã sao chép danh sách card của ${sellerDisplayName}.`,
									variant: "success",
								});
								window.setTimeout(
									() => setCopiedSeller((current) => (current === seller ? null : current)),
									1600,
								);
							};

							return (
								<section key={seller} className="border-b pb-5">
									<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
										<div className="flex items-center gap-1.5">
											<Link
												href={`/u/${encodeURIComponent(seller)}`}
												className="font-bold hover:text-[#5f793f] hover:underline"
											>
												{sellerDisplayName}
											</Link>
											{sellerFacebookUrl && (
												<a
													href={sellerFacebookUrl}
													target="_blank"
													rel="noreferrer"
													className="grid size-6 place-items-center rounded-sm border bg-card text-[10px] font-black text-primary transition-colors hover:bg-secondary"
											aria-label={`Mở Facebook của ${sellerDisplayName} để nhắn tin`}
													title="Mở Facebook để nhắn tin"
												>
													f
												</a>
											)}
										</div>
										<div className="flex items-center gap-2">
											<span className="text-[10px] text-muted-foreground">
												{sellerCount} card · Tổng:{" "}
												<strong className="text-foreground">
													{formatCurrency(sellerTotal)}
												</strong>
												{needsQuote && " + báo giá"}
											</span>
											<Button
												variant="outline"
												size="sm"
												className="h-7 px-2 text-[9px]"
												onClick={copyCards}
											>
												{copiedSeller === seller ? (
													<Check className="size-3" />
												) : (
													<Copy className="size-3" />
												)}
												{copiedSeller === seller ? "Đã copy" : "Copy"}
											</Button>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
										{sellerItems.map((item) => {
											const unitPrice = parseCurrency(item.price);
											return (
												<Card
													key={item.key}
													className="relative min-w-0 overflow-hidden p-2.5"
												>
													<Button
														variant="ghost"
														size="icon"
														className="absolute top-1 right-1 z-10 size-6 rounded-sm bg-card/85 text-muted-foreground shadow-sm backdrop-blur hover:text-destructive"
														onClick={() => removeItem(item.key)}
														aria-label={`Xoá ${item.name}`}
													>
														<Trash2 className="size-3" />
													</Button>
													<div className="flex min-w-0 gap-2.5">
														<div
															className={cn(
																"relative grid h-20 aspect-[469/655] shrink-0 place-items-center overflow-hidden rounded-[5px] border-2 border-[#bca66e] bg-gradient-to-br",
																item.gradient,
															)}
														>
															{item.imageUrl && (
																<img
																	src={item.imageUrl}
																	alt=""
																	className="absolute inset-0 size-full object-cover"
																/>
															)}
														</div>
														<div className="min-w-0 pt-0.5">
															<p className="truncate pr-5 text-[8px] font-bold tracking-wide text-muted-foreground uppercase">
																{item.set} · {item.number}
															</p>
															<h2 className="mt-1 truncate text-xs leading-4 font-bold">
																{item.name}
															</h2>
															<span className="mt-3 block text-[9px] text-muted-foreground">
																{unitPrice === null
																	? item.price
																	: formatCurrency(unitPrice)}{" "}
																/ lá
															</span>
														</div>
													</div>
													<div className="mt-2 flex items-center justify-between border-t pt-1.5">
														<strong className="text-xs">
															{unitPrice === null
																? "Liên hệ"
																: formatCurrency(unitPrice * item.quantity)}
														</strong>
														<div className="flex items-center rounded-sm border bg-background p-px">
															<button
																type="button"
																className="grid size-4.5 place-items-center rounded-sm hover:bg-secondary disabled:opacity-30"
																disabled={item.quantity <= 1}
																onClick={() =>
																	changeQuantity(
																		item.key,
																		item.quantity - 1,
																	)
																}
																aria-label="Giảm số lượng"
															>
																<Minus className="size-2.5" />
															</button>
															<span className="w-7 text-center text-[8px] font-black">
																{item.quantity}
																{quantityLimitKey === item.key &&
																	`/${item.stock}`}
															</span>
															<button
																type="button"
																className="grid size-4.5 place-items-center rounded-sm hover:bg-secondary disabled:opacity-30"
																disabled={item.quantity >= item.stock}
																onClick={() =>
																	changeQuantity(
																		item.key,
																		item.quantity + 1,
																	)
																}
																aria-label="Tăng số lượng"
															>
																<Plus className="size-2.5" />
															</button>
														</div>
													</div>
												</Card>
											);
										})}
									</div>
									<div className="mt-4 flex justify-end">
										<Button
											disabled={sendingSellers.has(seller)}
											onClick={() => requestFromSeller(sellerItems)}
										>
											{sendingSellers.has(seller) ? "Đang gửi..." : `Gửi yêu cầu đến ${sellerDisplayName}`}
										</Button>
									</div>
								</section>
							);
						})}
					</div>
				)}
			</div>
			{guestDialogOpen && (
				<div
					className="fixed inset-0 z-50 grid place-items-center px-4"
					role="dialog"
					aria-modal="true"
					aria-labelledby="guest-contact-title"
				>
					<button
						type="button"
						className="absolute inset-0 bg-primary/40 backdrop-blur-[1px]"
						onClick={() => setGuestDialogOpen(false)}
						aria-label="Đóng"
					/>
					<Card className="relative z-10 w-full max-w-md p-5 shadow-2xl sm:p-6">
						<button
							type="button"
							className="absolute top-3 right-3 grid size-8 place-items-center rounded-full hover:bg-secondary"
							onClick={() => setGuestDialogOpen(false)}
							aria-label="Đóng"
						>
							<X className="size-4" />
						</button>
						<h2 id="guest-contact-title" className="pr-8 font-serif text-lg font-semibold">
							Gửi yêu cầu đến {pendingItems[0]?.sellerDisplayName || "người bán"}
						</h2>
						<p className="mt-2 text-xs leading-5 text-muted-foreground">
							Bạn có muốn tạo tài khoản để theo dõi và quản lý các yêu cầu mua dễ dàng hơn không?
							Nếu tiếp tục với tư cách khách, bạn sẽ cần chủ động liên lạc với người bán.
						</p>
						<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button
								type="button"
								variant="outline"
								disabled={sendingSellers.has(pendingItems[0]?.seller ?? "")}
								onClick={() => void sendRequest(pendingItems)}
							>
								Tôi sẽ chủ động liên lạc
							</Button>
							<Link
								href="/register?next=/cart"
								className={buttonVariants()}
								onClick={() => setGuestDialogOpen(false)}
							>
								Tạo tài khoản
							</Link>
						</div>
					</Card>
				</div>
			)}
		</main>
	);
}
