"use client";

import { LibraryBig, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageLoading } from "@/components/page-loading";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { AddCardDrawer } from "./_components/add-card-drawer";
import { CollectionFilters } from "./_components/collection-filters";
import { CollectionToolbar } from "./_components/collection-toolbar";
import { DomainSection } from "./_components/domain-section";
import { useCollectionEditor } from "./_hooks/use-collection-editor";
import { QUICK_PRICING_RARITIES } from "./_lib/constants";

export default function CollectionPage() {
  const editor = useCollectionEditor();
  if (!editor.ready) return <PageLoading />;

  const openDrawer = () => editor.setDrawerOpen(true);
  const copyCount = editor.positiveEdits.reduce(
    (total, edit) => total + edit.quantity,
    0,
  );
  const pricingCount = editor.cards.filter(
    (card) =>
      editor.draft[card.id]?.quantity > 0 &&
      QUICK_PRICING_RARITIES.includes(card.rarity),
  ).length;

  return (
    <main className="collection-editor paper-grid min-h-dvh overflow-x-hidden">
      <div className="mx-auto max-w-[1320px] px-4 py-5 sm:px-7">
        <SiteHeader className="pb-4" />
        <CollectionToolbar
          username={editor.username}
          typeCount={editor.positiveEdits.length}
          copyCount={copyCount}
          dirty={editor.dirty}
          saving={editor.saving}
          saveStatus={editor.saveStatus}
          pricingOpen={editor.pricingOpen}
          setPricingOpen={editor.setPricingOpen}
          minimums={editor.minimums}
          multipliers={editor.multipliers}
          setMinimum={editor.setMinimum}
          setMultiplier={editor.setMultiplier}
          pricingCount={pricingCount}
          openDrawer={openDrawer}
          applyBulkPricing={editor.applyBulkPricing}
          saveChanges={editor.saveChanges}
        />
        {editor.saveStatus === "error" && (
          <div
            role="alert"
            className="mb-3 rounded-sm border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
          >
            Lưu thất bại. Các thay đổi của bạn vẫn được giữ lại.
          </div>
        )}
        <CollectionFilters
          query={editor.query}
          setQuery={editor.setQuery}
          values={editor.filter}
          setValues={editor.setFilter}
          options={editor.options}
        />
        {!editor.cards.length ? (
          <EmptyState
            icon={LibraryBig}
            title="Collection của bạn đang trống"
            description="Bắt đầu bằng cách thêm những card bạn đang sở hữu."
            className="min-h-64 rounded-sm shadow-none"
          >
            <Button className="mt-4" size="sm" onClick={openDrawer}>
              <Plus className="size-3.5" /> Thêm card
            </Button>
          </EmptyState>
        ) : !editor.groups.length ? (
          <EmptyState
            icon={LibraryBig}
            title="Không tìm thấy card phù hợp"
            description="Thử thay đổi từ khóa hoặc bộ lọc hiện tại."
            className="min-h-64 rounded-sm shadow-none"
          >
            <Button className="mt-4" size="sm" onClick={editor.clearFilters}>
              <Plus className="size-3.5" /> Xóa bộ lọc
            </Button>
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {editor.groups.map(([domain, cards]) => (
              <DomainSection
                key={domain}
                domain={domain}
                cards={cards}
                draft={editor.draft}
                saved={editor.saved}
                sort={editor.sort}
                changeSort={editor.changeSort}
                updateCard={editor.updateCard}
              />
            ))}
          </div>
        )}
      </div>
      {editor.drawerOpen && (
        <AddCardDrawer
          savedIds={new Set(Object.keys(editor.saved))}
          draft={editor.draft}
          cardMap={editor.cardMap}
          mergeCards={editor.mergeCards}
          updateCard={editor.updateCard}
          close={() => editor.setDrawerOpen(false)}
        />
      )}
    </main>
  );
}
