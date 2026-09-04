"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Check,
	ChevronDown,
	Eye,
	LibraryBig,
	Loader2,
	Minus,
	Plus,
	Save,
	Search,
	SlidersHorizontal,
	X,
} from "lucide-react";
import { AccountLink } from "@/components/account-link";
import { BrandLogo } from "@/components/brand-logo";
import { DomainFilter, FilterDropdown } from "@/components/domain-filter";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/page-title";
import { PageLoading } from "@/components/page-loading";
import { cn } from "@/lib/utils";
import { currencyConfig, formatCurrency } from "@/lib/currency";
import { useDebounce } from "@/lib/use-debounce";
import { announceDropdownOpen, DROPDOWN_OPEN_EVENT } from "@/lib/dropdown-coordination";
import {
	RIFTBOUND_CARD_TYPES,
	RIFTBOUND_DOMAIN_COLORS,
	RIFTBOUND_DOMAINS,
	RIFTBOUND_RARITIES,
} from "@/lib/riftbound-constants";

type CardData = {
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
type ApiListing = Omit<CardData, "id"> & {
	cardId: string;
	quantity: number;
	minPrice: number | string;
	tcgMultiplier: number;
};
type Edit = { quantity: number; minPrice: number; tcgMultiplier: number };
type Filters = { sets: string[]; types: string[]; rarities: string[]; domains: string[] };
type Sort = { key: "name" | "quantity" | "finalPrice"; direction: "asc" | "desc" };
const domainOrder = ["Body", "Calm", "Chaos", "Fury", "Mind", "Order"];
const quickPricingRarities = ["Common", "Uncommon", "Rare", "Epic", "Overnumbered"];
const quickPricingRarityColors: Record<string, string> = {
	Common: "#e5e7eb",
	Uncommon: "#a7f3d0",
	Rare: "#fbcfe8",
	Epic: "#a5f3fc",
	Overnumbered: "#fef08a",
};

export default function CollectionPage() {
	const [username, setUsername] = useState("");
	const [saved, setSaved] = useState<Record<string, Edit>>({});
	const [draft, setDraft] = useState<Record<string, Edit>>({});
	const [cardMap, setCardMap] = useState<Record<string, CardData>>({});
	const [ready, setReady] = useState(false);
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query);
	const [filter, setFilter] = useState(["", "", "", ""]);
	const [drawer, setDrawer] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
	const [pricing, setPricing] = useState(false);
	const [sort, setSort] = useState<Sort>({ key: "name", direction: "asc" });
	const [minimums, setMinimums] = useState<Record<string, number>>(() =>
		Object.fromEntries(
			Object.entries(currencyConfig.quickMinimums).map(([r, v]) => [
				r[0].toUpperCase() + r.slice(1),
				v,
			]),
		),
	);
	const [multipliers, setMultipliers] = useState<Record<string, number>>({
		Common: 0.8,
		Uncommon: 0.85,
		Rare: 0.9,
		Epic: 0.95,
		Legendary: 1,
	});

	useEffect(() => {
		fetch("/api/listings")
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((data: { items?: ApiListing[]; user?: { username: string } }) => {
				const items = data.items ?? [];
				const baseline = Object.fromEntries(
					items.map((x) => [
						x.cardId,
						{
							quantity: x.quantity,
							minPrice: Number(x.minPrice),
							tcgMultiplier: Number(x.tcgMultiplier),
						},
					]),
				);
				setUsername(data.user?.username ?? "");
				setSaved(baseline);
				setDraft(baseline);
				setCardMap(Object.fromEntries(items.map((x) => [x.cardId, fromListing(x)])));
			})
			.finally(() => setReady(true));
	}, []);
	const dirty = useMemo(() => !same(saved, draft), [saved, draft]);
	useEffect(() => {
		const unload = (e: BeforeUnloadEvent) => {
			if (dirty) e.preventDefault();
		};
		const click = (e: MouseEvent) => {
			if (!dirty || e.defaultPrevented || e.button) return;
			const a = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
			if (
				a &&
				a.origin === location.origin &&
				a.pathname !== location.pathname &&
				!confirm("Bạn có thay đổi chưa lưu. Bạn vẫn muốn rời trang?")
			)
				e.preventDefault();
		};
		addEventListener("beforeunload", unload);
		document.addEventListener("click", click, true);
		return () => {
			removeEventListener("beforeunload", unload);
			document.removeEventListener("click", click, true);
		};
	}, [dirty]);

	const cards = useMemo(
		() =>
			Object.keys(draft)
				.filter((id) => saved[id] || draft[id].quantity > 0)
				.map((id) => cardMap[id])
				.filter(Boolean),
		[cardMap, draft, saved],
	);
	const options = useMemo<Filters>(
		() => ({
			sets: uniq(cards.map((c) => c.set)),
			types: uniq(cards.map((c) => c.type)),
			rarities: uniq(cards.map((c) => c.rarity)),
			domains: uniq(cards.flatMap((c) => c.domains)),
		}),
		[cards],
	);
	const visible = useMemo(() => {
		const q = debouncedQuery.trim().toLocaleLowerCase("vi");
		return cards.filter(
			(c) =>
				(!q ||
					[c.name, c.set, String(c.collectorNumber)].some((x) =>
						x.toLocaleLowerCase("vi").includes(q),
					)) &&
				(!filter[0] || c.set === filter[0]) &&
				(!filter[1] || c.type === filter[1]) &&
				(!filter[2] || c.rarity === filter[2]) &&
				(!filter[3] || c.domains.includes(filter[3])),
		);
	}, [cards, debouncedQuery, filter]);
	const groups = useMemo(() => {
		const map = new Map<string, CardData[]>();
		visible.forEach((c) => {
			const d = c.domains[0] || "Không có Domain";
			map.set(d, [...(map.get(d) ?? []), c]);
		});
		return [...map]
			.sort(([a], [b]) => rank(a) - rank(b))
			.map(([d, list]) => [d, list.sort((a, b) => compareBySort(a, b, draft, sort))] as const);
	}, [draft, sort, visible]);
	const changeSort = (key: Sort["key"]) => {
		setSort((current) => ({
			key,
			direction:
				current.key === key
					? current.direction === "asc"
						? "desc"
						: "asc"
					: key === "name"
						? "asc"
						: "desc",
		}));
	};
	const positive = Object.values(draft).filter((x) => x.quantity > 0);
	const update = (id: string, patch: Partial<Edit>) => {
		setSaveStatus("idle");
		setDraft((x) => ({ ...x, [id]: { ...editOf(x[id]), ...patch } }));
	};
	const save = async () => {
		if (!dirty || saving) return;
		setSaving(true);
		setSaveStatus("idle");
		try {
			const r = await fetch("/api/listings", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: Object.entries(draft).map(([cardId, edit]) => ({ cardId, ...edit })),
				}),
			});
			if (!r.ok) throw new Error();
			const clean = Object.fromEntries(Object.entries(draft).filter(([, e]) => e.quantity > 0));
			setSaved(clean);
			setDraft(clean);
			setSaveStatus("saved");
			setTimeout(() => setSaveStatus("idle"), 1800);
		} catch {
			setSaveStatus("error");
		} finally {
			setSaving(false);
		}
	};
	const clearFilters = () => {
		setQuery("");
		setFilter(["", "", "", ""]);
	};
	const bulk = () => {
		setDraft((current) => {
			const next = { ...current };
			cards.forEach((c) => {
				if (next[c.id]?.quantity > 0 && quickPricingRarities.includes(c.rarity))
					next[c.id] = {
						...next[c.id],
						minPrice: minimums[c.rarity] ?? defaultMin(c.rarity),
						tcgMultiplier: multipliers[c.rarity] ?? defaultMult(c.rarity),
					};
			});
			return next;
		});
		setPricing(false);
	};
	if (!ready) return <PageLoading />;

	return (
		<main className="collection-editor paper-grid min-h-dvh overflow-x-hidden">
			<div className="mx-auto max-w-[1320px] px-4 py-5 sm:px-7">
				<header className="flex items-center justify-between border-b pb-4">
					<Link
						href="/"
						className="flex items-center gap-3 text-sm font-extrabold tracking-[.16em]"
					>
						<BrandLogo />{" "}
						RIPBAO
					</Link>
					<AccountLink />
				</header>
				<div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="flex gap-3 items-center">
						<PageTitle icon={LibraryBig}>Bộ sưu tập của bạn</PageTitle>
						<p className="mt-2 text-xs text-muted-foreground">
							<strong className="text-foreground">{positive.length}</strong> loại ·{" "}
							<strong className="text-foreground">
								{positive.reduce((n, e) => n + e.quantity, 0)}
							</strong>{" "}
							bản{dirty && <span className="ml-2 text-[#966027]">• Có thay đổi chưa lưu</span>}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						{username && (
							<Link
								href={`/u/${encodeURIComponent(username)}`}
								className={buttonVariants({ variant: "outline", size: "sm" })}
							>
								<Eye className="size-3.5" /> Xem trước
							</Link>
						)}
						<Button variant="outline" size="sm" onClick={() => setDrawer(true)}>
							<Plus className="size-3.5" /> Thêm card
						</Button>
						<Pricing
							open={pricing}
							setOpen={setPricing}
							rarities={quickPricingRarities}
							minimums={minimums}
							setMinimums={setMinimums}
							multipliers={multipliers}
							setMultipliers={setMultipliers}
							count={cards.filter(
								(c) => draft[c.id]?.quantity > 0 && quickPricingRarities.includes(c.rarity),
							).length}
							apply={bulk}
						/>
						<Button size="sm" disabled={!dirty || saving} onClick={save}>
							{saving ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : saveStatus === "saved" ? (
								<Check className="size-3.5" />
							) : (
								<Save className="size-3.5" />
							)}
							{saving ? "Đang lưu..." : saveStatus === "saved" ? "Đã lưu" : "Lưu thay đổi"}
						</Button>
					</div>
				</div>
				{saveStatus === "error" && (
					<div
						role="alert"
						className="mb-3 rounded-sm border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
					>
						Lưu thất bại. Các thay đổi của bạn vẫn được giữ lại.
					</div>
				)}
				<FiltersBar
					query={query}
					setQuery={setQuery}
					values={filter}
					setValues={setFilter}
					options={options}
				/>
				{!cards.length ? (
					<Empty
						title="Collection của bạn đang trống"
						text="Bắt đầu bằng cách thêm những card bạn đang sở hữu."
						action={() => setDrawer(true)}
					/>
				) : !groups.length ? (
					<Empty
						title="Không tìm thấy card phù hợp"
						text="Thử thay đổi từ khóa hoặc bộ lọc hiện tại."
						action={clearFilters}
						actionText="Xóa bộ lọc"
					/>
				) : (
					<div className="space-y-4">
						{groups.map(([domain, list]) => (
							<Section
								key={domain}
								domain={domain}
								cards={list}
								draft={draft}
								saved={saved}
								sort={sort}
								changeSort={changeSort}
								update={update}
							/>
						))}
					</div>
				)}
			</div>
			{drawer && (
				<Drawer
					savedIds={new Set(Object.keys(saved))}
					draft={draft}
					cardMap={cardMap}
					merge={(incoming) =>
						setCardMap((m) => ({ ...m, ...Object.fromEntries(incoming.map((c) => [c.id, c])) }))
					}
					update={update}
					close={() => setDrawer(false)}
				/>
			)}
		</main>
	);
}

function FiltersBar({
	query,
	setQuery,
	values,
	setValues,
	options,
}: {
	query: string;
	setQuery: (x: string) => void;
	values: string[];
	setValues: (x: string[]) => void;
	options: Filters;
}) {
	const set = (i: number, x: string) => setValues(values.map((v, n) => (n === i ? x : v)));
	return (
		<div className="mb-4 grid gap-2 rounded-sm border bg-card p-3 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_repeat(4,140px)]">
			<SearchBox value={query} set={setQuery} placeholder="Tìm trong collection..." />
			<FilterDropdown
				label="Set"
				value={values[0]}
				options={options.sets}
				onChange={(x) => set(0, x)}
			/>
			<FilterDropdown
				label="Loại"
				value={values[1]}
				options={options.types}
				onChange={(x) => set(1, x)}
			/>
			<FilterDropdown
				label="Độ hiếm"
				value={values[2]}
				options={options.rarities}
				onChange={(x) => set(2, x)}
			/>
			<DomainFilter value={values[3]} options={options.domains} onChange={(x) => set(3, x)} />
		</div>
	);
}

function Section({
	domain,
	cards,
	draft,
	saved,
	sort,
	changeSort,
	update,
}: {
	domain: string;
	cards: CardData[];
	draft: Record<string, Edit>;
	saved: Record<string, Edit>;
	sort: Sort;
	changeSort: (key: Sort["key"]) => void;
	update: (id: string, x: Partial<Edit>) => void;
}) {
	const copies = cards.reduce((n, c) => n + Math.max(0, draft[c.id]?.quantity ?? 0), 0);
	const color = domainColor(domain);
	return (
		<section
			className="overflow-hidden rounded-sm border bg-card shadow-sm"
			style={{ borderColor: color }}
		>
			<header
				className="flex items-center justify-between px-3 py-1.5 text-white"
				style={{ backgroundColor: color }}
			>
				<h2 className="text-xs font-extrabold">{domain}</h2>
				<span className="text-[9px] font-medium text-white/80">
					{cards.length} loại · {copies} bản
				</span>
			</header>
			<div className="hidden grid-cols-[52px_minmax(170px,1fr)_130px_112px_132px_92px_120px] gap-2 border-b bg-secondary/45 px-3 py-2 text-[9px] font-bold uppercase text-muted-foreground md:grid">
				<span>Ảnh</span>
				<SortButton label="Tên card" sortKey="name" sort={sort} changeSort={changeSort} />
				<span>Set / Mã</span>
				<SortButton label="Số lượng" sortKey="quantity" sort={sort} changeSort={changeSort} />
				<span>Giá Min</span>
				<span>× TCG</span>
				<SortButton
					label="Giá cuối"
					sortKey="finalPrice"
					sort={sort}
					changeSort={changeSort}
					className="justify-end border-l pl-3 text-right"
				/>
			</div>
			{cards.map((c) => (
				<Row
					key={c.id}
					card={c}
					edit={editOf(draft[c.id])}
					wasSaved={Boolean(saved[c.id])}
					update={update}
				/>
			))}
		</section>
	);
}

function SortButton({
	label,
	sortKey,
	sort,
	changeSort,
	className,
}: {
	label: string;
	sortKey: Sort["key"];
	sort: Sort;
	changeSort: (key: Sort["key"]) => void;
	className?: string;
}) {
	const active = sort.key === sortKey;
	const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
	return (
		<button
			type="button"
			onClick={() => changeSort(sortKey)}
			className={cn(
				"flex items-center gap-1 text-left uppercase hover:text-foreground",
				active && "text-foreground",
				className,
			)}
		>
			{label}
			<Icon className={cn("size-3", !active && "opacity-55")} aria-hidden="true" />
		</button>
	);
}

function Row({
	card,
	edit,
	wasSaved,
	update,
}: {
	card: CardData;
	edit: Edit;
	wasSaved: boolean;
	update: (id: string, x: Partial<Edit>) => void;
}) {
	return (
		<div
			className={cn(
				"grid gap-3 border-t p-3 first:border-t-0 md:grid-cols-[52px_minmax(170px,1fr)_130px_112px_132px_92px_120px] md:items-center md:gap-2",
				!edit.quantity && "bg-destructive/5",
			)}
		>
			<div className="flex gap-3 md:contents">
				<Image card={card} />
				<div className="min-w-0 flex-1 self-center">
					<strong className="block truncate text-xs">{card.name}</strong>
					<p className="mt-1 text-[9px] text-muted-foreground md:hidden">
						{card.set} · #{card.collectorNumber} · {card.rarity}
					</p>
					{!edit.quantity && (
						<span className="mt-1 inline-block rounded-sm bg-destructive/10 px-1.5 py-.5 text-[9px] font-bold text-destructive">
							{wasSaved ? "Sẽ xóa khi lưu" : "Chưa thêm"}
						</span>
					)}
				</div>
			</div>
			<div className="hidden text-[10px] md:block">
				<strong>{card.set}</strong>{" "}
				<span className="text-muted-foreground">#{card.collectorNumber}</span>
			</div>
			<div className="grid grid-cols-3 gap-2 md:contents">
				<label className="text-[9px] font-bold text-muted-foreground md:hidden">
					Số lượng
					<Quantity
						value={edit.quantity}
						name={card.name}
						set={(quantity) => update(card.id, { quantity })}
					/>
				</label>
				<div className="hidden md:block">
					<Quantity
						value={edit.quantity}
						name={card.name}
						set={(quantity) => update(card.id, { quantity })}
					/>
				</div>
				<label className="text-[9px] font-bold text-muted-foreground">
					<span className="md:hidden">Giá Min</span>
					<Money value={edit.minPrice} set={(minPrice) => update(card.id, { minPrice })} />
				</label>
				<label className="text-[9px] font-bold text-muted-foreground">
					<span className="md:hidden">× TCG</span>
					<Multiplier
						value={edit.tcgMultiplier}
						set={(tcgMultiplier) => update(card.id, { tcgMultiplier })}
						className="mt-1 md:mt-0"
					/>
				</label>
			</div>
			<div className="text-right md:border-l md:pl-3">
				<span className="text-[9px] font-bold text-muted-foreground md:hidden">Giá cuối </span>
				<strong className="text-[10px] text-[#506b32]">{finalPrice(card, edit)}</strong>
			</div>
		</div>
	);
}

function Drawer({
	savedIds,
	draft,
	cardMap,
	merge,
	update,
	close,
}: {
	savedIds: Set<string>;
	draft: Record<string, Edit>;
	cardMap: Record<string, CardData>;
	merge: (x: CardData[]) => void;
	update: (id: string, x: Partial<Edit>) => void;
	close: () => void;
}) {
	const [query, setQuery] = useState("");
	const q = useDebounce(query);
	const [values, setValues] = useState(["", "", "", ""]);
	const [filters, setFilters] = useState<Filters>({
		sets: [],
		types: [...RIFTBOUND_CARD_TYPES],
		rarities: [...RIFTBOUND_RARITIES],
		domains: [...RIFTBOUND_DOMAINS],
	});
	const [page, setPage] = useState(1);
	const [pages, setPages] = useState(1);
	const [cards, setCards] = useState<CardData[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAddedOnly, setShowAddedOnly] = useState(false);
	const panel = useRef<HTMLElement>(null);
	const scroll = useRef<HTMLDivElement>(null);
	const more = useRef<HTMLDivElement>(null);
	useEffect(() => {
		fetch("/api/cards/filters")
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then(setFilters)
			.catch(() => undefined);
	}, []);
	useEffect(() => {
		setPage(1);
	}, [q, values]);
	useEffect(() => {
		const controller = new AbortController();
		const p = new URLSearchParams({ page: String(page), size: "30" });
		if (q.trim()) p.set("q", q.trim());
		["set", "type", "rarity", "domain"].forEach((k, i) => values[i] && p.set(k, values[i]));
		setLoading(true);
		fetch(`/api/cards?${p}`, { signal: controller.signal })
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((data: { items?: CardData[]; pages?: number }) => {
				const incoming = data.items ?? [];
				merge(incoming);
				setCards((old) => uniqueCards(page === 1 ? incoming : [...old, ...incoming]));
				setPages(Math.max(1, data.pages ?? 1));
			})
			.catch(() => undefined)
			.finally(() => !controller.signal.aborted && setLoading(false));
		return () => controller.abort();
	}, [q, page, values]);
	useEffect(() => {
		const target = more.current;
		if (!target || loading || page >= pages) return;
		const o = new IntersectionObserver(([e]) => e.isIntersecting && setPage((x) => x + 1), {
			root: scroll.current,
			rootMargin: "250px",
		});
		o.observe(target);
		return () => o.disconnect();
	}, [loading, page, pages]);
	useEffect(() => {
		const old = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		panel.current?.focus();
		const key = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
			if (e.key === "Tab" && panel.current) {
				const nodes = [
					...panel.current.querySelectorAll<HTMLElement>(
						'button,input,[href],[tabindex]:not([tabindex="-1"])',
					),
				].filter((n) => !n.hasAttribute("disabled"));
				const first = nodes[0],
					last = nodes.at(-1);
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last?.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first?.focus();
				}
			}
		};
		document.addEventListener("keydown", key);
		return () => {
			document.body.style.overflow = old;
			document.removeEventListener("keydown", key);
		};
	}, []);
	const added = Object.entries(draft).filter(([id, e]) => !savedIds.has(id) && e.quantity > 0);
	const available = uniqueCards([
		...cards.filter((c) => !savedIds.has(c.id)),
		...added.map(([id]) => cardMap[id]).filter(Boolean),
	]);
	const visible = showAddedOnly
		? available.filter((c) => (draft[c.id]?.quantity ?? 0) > 0)
		: available;
	const setValue = (i: number, x: string) => setValues((v) => v.map((a, n) => (n === i ? x : a)));
	return (
		<div
			className="fixed inset-0 z-50 bg-black/45"
			onMouseDown={(e) => e.target === e.currentTarget && close()}
		>
			<aside
				ref={panel}
				tabIndex={-1}
				role="dialog"
				aria-modal="true"
				aria-labelledby="drawer-title"
				className="absolute inset-y-0 right-0 flex w-full flex-col bg-background shadow-2xl outline-none sm:w-[min(92vw,760px)]"
			>
				<header className="flex items-center justify-between border-b bg-card p-4">
					<div>
						<h2 id="drawer-title" className="font-serif text-lg font-bold">
							Thêm card
						</h2>
						<p className="text-[10px] text-muted-foreground">
							Tìm và thêm nhiều card vào bản nháp.
						</p>
					</div>
					<button
						onClick={close}
						aria-label="Đóng"
						className="grid size-9 place-items-center rounded-sm hover:bg-secondary"
					>
						<X />
					</button>
				</header>
				<div className="space-y-2 border-b bg-card p-3">
					<SearchBox value={query} set={setQuery} placeholder="Tìm tên hoặc mã card..." />
					<div className="grid grid-cols-2 gap-2 [&>details>summary]:w-full">
						<FilterDropdown
							label="Set"
							value={values[0]}
							options={filters.sets}
							onChange={(x) => setValue(0, x)}
						/>
						<FilterDropdown
							label="Loại"
							value={values[1]}
							options={filters.types}
							onChange={(x) => setValue(1, x)}
						/>
						<FilterDropdown
							label="Độ hiếm"
							value={values[2]}
							options={filters.rarities}
							onChange={(x) => setValue(2, x)}
						/>
						<DomainFilter
							value={values[3]}
							options={filters.domains}
							onChange={(x) => setValue(3, x)}
						/>
					</div>
				</div>
				<div ref={scroll} className="collection-scrollbar flex-1 overflow-y-auto p-3">
					<div className="grid gap-2 sm:grid-cols-2">
						{visible.map((c) => {
							const quantity = draft[c.id]?.quantity ?? 0;
							return (
								<article key={c.id} className="flex gap-3 rounded-sm border bg-card p-2">
									<Image card={c} className="h-[88px] w-16" />
									<div className="min-w-0 flex-1">
										<strong className="block truncate text-[11px]">{c.name}</strong>
										<p className="mt-1 text-[9px] text-muted-foreground">
											{c.set} · #{c.collectorNumber} · {c.rarity}
										</p>
										<p
											className="truncate text-[9px]"
											style={{ color: domainColor(c.domains[0]) }}
										>
											{c.domains.join(" · ") || "Không có Domain"}
										</p>
										<div className="mt-2 flex items-center justify-between">
											<Quantity
												value={quantity}
												name={c.name}
												set={(x) =>
													update(c.id, {
														quantity: x,
														minPrice:
															draft[c.id]?.minPrice ?? defaultMin(c.rarity),
														tcgMultiplier:
															draft[c.id]?.tcgMultiplier ??
															defaultMult(c.rarity),
													})
													}
											/>
											{quantity > 0 && (
												<span className="rounded-sm bg-accent/40 px-1.5 py-1 text-[9px] font-bold">
													Đã thêm {quantity}
												</span>
											)}
										</div>
									</div>
								</article>
							);
						})}
					</div>
					{loading && (
						<div className="grid h-20 place-items-center">
							<Loader2 className="size-5 animate-spin" />
						</div>
					)}
					{!loading && !visible.length && (
						<div className="grid h-40 place-items-center text-xs text-muted-foreground">
							Không tìm thấy card có thể thêm.
						</div>
					)}
					<div ref={more} className="h-2" />
				</div>
				<footer className="flex items-center justify-between border-t bg-card p-4">
					<span className="text-[10px] text-muted-foreground">
						<strong className="text-foreground">{added.length}</strong> loại ·{" "}
						<strong className="text-foreground">
							{added.reduce((n, [, e]) => n + e.quantity, 0)}
						</strong>{" "}
						bản vừa thêm
					</span>
					<div className="flex items-center gap-3">
						<label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold">
							<input
								type="checkbox"
								checked={showAddedOnly}
								onChange={(e) => setShowAddedOnly(e.target.checked)}
								className="size-4 accent-primary"
							/>
							Chỉ hiện đã thêm
						</label>
						<Button onClick={close}>Xong</Button>
					</div>
				</footer>
			</aside>
		</div>
	);
}

function Pricing(p: {
	open: boolean;
	setOpen: (x: boolean) => void;
	rarities: string[];
	minimums: Record<string, number>;
	setMinimums: React.Dispatch<React.SetStateAction<Record<string, number>>>;
	multipliers: Record<string, number>;
	setMultipliers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
	count: number;
	apply: () => void;
}) {
	const dropdownId = useId();

	useEffect(() => {
		const closeForOtherDropdown = (event: Event) => {
			if ((event as CustomEvent<string>).detail !== dropdownId) p.setOpen(false);
		};
		document.addEventListener(DROPDOWN_OPEN_EVENT, closeForOtherDropdown);
		return () => document.removeEventListener(DROPDOWN_OPEN_EVENT, closeForOtherDropdown);
	}, [dropdownId, p.setOpen]);

	useEffect(() => {
		if (p.open) announceDropdownOpen(dropdownId);
	}, [dropdownId, p.open]);

	return (
		<div className="relative">
			<Button variant="outline" size="sm" onClick={() => p.setOpen(!p.open)}>
				<SlidersHorizontal className="size-3.5" /> Thiết lập giá{" "}
				<ChevronDown className={cn("size-3", p.open && "rotate-180")} />
			</Button>
			{p.open && (
				<div className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,420px)] rounded-sm border bg-card p-3 shadow-xl">
					<strong className="text-xs">Thiết lập giá nhanh</strong>
					<div className="mt-3 grid grid-cols-[1fr_120px_90px] items-center gap-2">
						<span className="text-[9px] font-bold text-muted-foreground">Độ hiếm</span>
						<span className="text-[9px] font-bold text-muted-foreground">Giá tối thiểu</span>
						<span className="text-[9px] font-bold text-muted-foreground">Hệ số TCG</span>
						{p.rarities.map((r) => (
							<div key={r} className="contents">
								<span className="flex min-w-0 items-center gap-2 text-[10px] font-bold">
									<span
										aria-hidden="true"
										className="size-2.5 shrink-0 rounded-[2px] border border-black/15"
										style={{ backgroundColor: quickPricingRarityColors[r] }}
									/>
									{r}
								</span>
								<Money
									value={p.minimums[r] ?? defaultMin(r)}
									set={(x) => p.setMinimums((v) => ({ ...v, [r]: x }))}
								/>
								<Multiplier
									value={p.multipliers[r] ?? defaultMult(r)}
									set={(x) => p.setMultipliers((v) => ({ ...v, [r]: x }))}
								/>
							</div>
						))}
					</div>
					<div className="mt-3 flex items-center justify-between border-t pt-3">
						<span className="text-[9px] text-muted-foreground">{p.count} loại sẽ cập nhật</span>
						<Button size="sm" disabled={!p.count} onClick={p.apply}>
							<Check className="size-3" /> Áp dụng
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
function SearchBox({
	value,
	set,
	placeholder,
}: {
	value: string;
	set: (x: string) => void;
	placeholder: string;
}) {
	return (
		<div className="relative">
			<Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
			<Input
				value={value}
				onChange={(e) => set(e.target.value)}
				className="h-8 pl-8 pr-8 text-xs"
				placeholder={placeholder}
			/>
			{value && (
				<button
					onClick={() => set("")}
					className="absolute right-2 top-1/2 -translate-y-1/2"
					aria-label="Xóa tìm kiếm"
				>
					<X className="size-3" />
				</button>
			)}
		</div>
	);
}
function Empty({
	title,
	text,
	action,
	actionText = "Thêm card",
}: {
	title: string;
	text: string;
	action: () => void;
	actionText?: string;
}) {
	return (
		<div className="grid min-h-64 place-items-center rounded-sm border border-dashed bg-card/70 p-8 text-center">
			<div>
				<LibraryBig className="mx-auto size-8 text-muted-foreground" />
				<h2 className="mt-3 font-serif text-lg font-semibold">{title}</h2>
				<p className="mt-1 text-xs text-muted-foreground">{text}</p>
				<Button className="mt-4" size="sm" onClick={action}>
					<Plus className="size-3.5" /> {actionText}
				</Button>
			</div>
		</div>
	);
}
function Quantity({ value, name, set }: { value: number; name: string; set: (x: number) => void }) {
	return (
		<div className="mt-1 flex w-fit items-center overflow-hidden rounded-sm border bg-background md:mt-0">
			<button
				className="grid size-8 place-items-center hover:bg-secondary disabled:opacity-30"
				disabled={value <= 0}
				onClick={() => set(Math.max(0, value - 1))}
				aria-label={`Giảm số lượng ${name}`}
			>
				<Minus className="size-3" />
			</button>
			<input
				type="number"
				min="0"
				value={value}
				onFocus={(e) => e.currentTarget.select()}
				onChange={(e) => set(Math.max(0, e.target.valueAsNumber || 0))}
				className="h-8 w-10 border-x bg-background text-center text-xs font-black outline-none"
				aria-label={`Số lượng ${name}`}
			/>
			<button
				className="grid size-8 place-items-center hover:bg-secondary"
				onClick={() => set(value + 1)}
				aria-label={`Tăng số lượng ${name}`}
			>
				<Plus className="size-3" />
			</button>
		</div>
	);
}
function Money({ value, set }: { value: number; set: (x: number) => void }) {
	const [inputValue, setInputValue] = useState(String(value));

	useEffect(() => {
		setInputValue(String(value));
	}, [value]);

	const commit = () => {
		const parsed = Number(inputValue);
		const next = inputValue === "" || !Number.isFinite(parsed) || parsed < 0 ? 0 : parsed;
		setInputValue(String(next));
		set(next);
	};

	return (
		<div className="relative mt-1 md:mt-0">
			<span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
				{currencyConfig.symbol}
			</span>
			<input
				type="number"
				min="0"
				step={currencyConfig.inputStep}
				value={inputValue}
				onChange={(e) => {
					const next = e.target.value;
					setInputValue(next);
					const parsed = Number(next);
					if (next !== "" && Number.isFinite(parsed) && parsed >= 0) set(parsed);
				}}
				onBlur={commit}
				className="h-8 w-full rounded-sm border bg-background pl-6 pr-2 text-[10px] font-bold"
			/>
		</div>
	);
}
function Multiplier({
	value,
	set,
	className,
}: {
	value: number;
	set: (x: number) => void;
	className?: string;
}) {
	const [inputValue, setInputValue] = useState(String(value));

	useEffect(() => {
		setInputValue(String(value));
	}, [value]);

	const commit = () => {
		const parsed = Number(inputValue);
		const next = inputValue === "" || !Number.isFinite(parsed) || parsed < 0 ? 0 : parsed;
		setInputValue(String(next));
		set(next);
	};

	return (
		<input
			type="number"
			min="0"
			step=".05"
			value={inputValue}
			onChange={(e) => {
				const next = e.target.value;
				setInputValue(next);
				const parsed = Number(next);
				if (next !== "" && Number.isFinite(parsed) && parsed >= 0) set(parsed);
			}}
			onBlur={commit}
			className={cn(
				"h-8 w-full rounded-sm border bg-background px-2 text-center text-[10px] font-bold",
				className,
			)}
		/>
	);
}
function Image({ card, className }: { card: CardData; className?: string }) {
	return (
		<div
			className={cn(
				"h-14 w-10 shrink-0 overflow-hidden rounded-[3px] border bg-secondary",
				className,
			)}
		>
			{card.imageUrl && (
				<img src={card.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
			)}
		</div>
	);
}
function fromListing(x: ApiListing): CardData {
	return {
		id: x.cardId,
		collectorNumber: x.collectorNumber,
		name: x.name,
		set: x.set,
		rarity: x.rarity,
		type: x.type,
		domains: x.domains ?? [],
		supertype: x.supertype,
		imageUrl: x.imageUrl,
		tcgPrice: x.tcgPrice,
	};
}
function editOf(x?: Partial<Edit>): Edit {
	return {
		quantity: x?.quantity ?? 0,
		minPrice: Number(x?.minPrice) || 0,
		tcgMultiplier: Number(x?.tcgMultiplier) || 0.9,
	};
}
function same(a: Record<string, Edit>, b: Record<string, Edit>) {
	return uniq([...Object.keys(a), ...Object.keys(b)]).every((id) => {
		const x = editOf(a[id]),
			y = editOf(b[id]);
		return x.quantity === y.quantity && x.minPrice === y.minPrice && x.tcgMultiplier === y.tcgMultiplier;
	});
}
function uniq(x: string[]) {
	return [...new Set(x.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
function uniqueCards(x: CardData[]) {
	return [...new Map(x.filter(Boolean).map((c) => [c.id, c])).values()];
}
function rank(d: string) {
	const n = domainOrder.indexOf(d);
	return n < 0 ? domainOrder.length : n;
}
function domainColor(domain?: string) {
	return RIFTBOUND_DOMAIN_COLORS[domain as keyof typeof RIFTBOUND_DOMAIN_COLORS] ?? "#706f68";
}
function compare(a: CardData, b: CardData) {
	return (
		a.name.localeCompare(b.name, "vi", { sensitivity: "base" }) ||
		a.set.localeCompare(b.set) ||
		a.collectorNumber - b.collectorNumber
	);
}
function compareBySort(
	a: CardData,
	b: CardData,
	draft: Record<string, Edit>,
	sort: Sort,
) {
	const aEdit = editOf(draft[a.id]);
	const bEdit = editOf(draft[b.id]);
	const result =
		sort.key === "name"
			? compare(a, b)
			: sort.key === "quantity"
				? aEdit.quantity - bEdit.quantity
				: finalPriceValue(a, aEdit) - finalPriceValue(b, bEdit);
	return (sort.direction === "asc" ? result : -result) || compare(a, b);
}
function finalPrice(c: CardData, e: Edit) {
	const n = finalPriceValue(c, e);
	return n > 0 ? formatCurrency(n) : "—";
}
function finalPriceValue(c: CardData, e: Edit) {
	return Math.max(e.minPrice, (c.tcgPrice ?? 0) * e.tcgMultiplier);
}
function defaultMin(r: string) {
	return currencyConfig.quickMinimums[r.toLowerCase()] ?? 0;
}
function defaultMult(r: string) {
	return (
		({ common: 0.8, uncommon: 0.85, rare: 0.9, epic: 0.95, legendary: 1 } as Record<string, number>)[
			r.toLowerCase()
		] ?? 0.9
	);
}
