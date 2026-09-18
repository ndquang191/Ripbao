import { describe, expect, test } from "bun:test";
import {
  cardIdFromVariantKey,
  defaultFinish,
  editFor,
  finalPriceValue,
  isAutoFoilRarity,
  isTcgPriceStale,
  sameEdits,
  totalQuantity,
  supportsDualFinish,
  variantKey,
} from "./collection-utils";
import { type CollectionDraft } from "./models";

const draft: CollectionDraft = {
  [variantKey("stupefy", "nonfoil")]: {
    quantity: 2,
    minPrice: 30_000,
    tcgMultiplier: 25,
  },
  [variantKey("stupefy", "foil")]: {
    quantity: 1,
    minPrice: 80_000,
    tcgMultiplier: 25,
  },
};

describe("collection variants", () => {
  test("only common and uncommon support both finishes", () => {
    expect(supportsDualFinish("Common")).toBe(true);
    expect(supportsDualFinish("Uncommon")).toBe(true);
    expect(supportsDualFinish("Rare")).toBe(false);
    expect(supportsDualFinish("Epic")).toBe(false);
    expect(supportsDualFinish("Overnumbered")).toBe(false);
  });

  test("higher rarities default to foil", () => {
    expect(defaultFinish("Common")).toBe("nonfoil");
    expect(defaultFinish("Uncommon")).toBe("nonfoil");
    expect(defaultFinish("Rare")).toBe("foil");
    expect(defaultFinish("Epic")).toBe("foil");
    expect(defaultFinish("Overnumbered")).toBe("foil");
    expect(isAutoFoilRarity("Promo")).toBe(true);
    expect(isAutoFoilRarity("Showcase")).toBe(true);
    expect(isAutoFoilRarity("Common")).toBe(false);
  });

  test("keeps foil and nonfoil quantities and prices separate", () => {
    expect(totalQuantity(draft, "stupefy")).toBe(3);
    expect(editFor(draft, "stupefy", "nonfoil").quantity).toBe(2);
    expect(editFor(draft, "stupefy", "nonfoil").minPrice).toBe(30_000);
    expect(editFor(draft, "stupefy", "foil").quantity).toBe(1);
    expect(editFor(draft, "stupefy", "foil").minPrice).toBe(80_000);
  });

  test("round-trips a card id through its variant key", () => {
    expect(cardIdFromVariantKey(variantKey("card:id", "foil"))).toBe("card:id");
  });

  test("detects a price change on only one finish", () => {
    const changed = {
      ...draft,
      [variantKey("stupefy", "foil")]: {
        ...draft[variantKey("stupefy", "foil")],
        minPrice: 90_000,
      },
    };
    expect(sameEdits(draft, changed)).toBe(false);
  });

  test("uses the market price for the selected finish", () => {
    const card = {
      id: "stupefy",
      collectorNumber: 1,
      name: "Stupefy",
      set: "Origins",
      rarity: "Common",
      type: "Spell",
      domains: [],
      imageUrl: "https://example.com/card.png",
      tcgPrices: {
        nonfoil: { marketPriceUsd: 0.4, sourceUpdatedAt: new Date().toISOString() },
        foil: { marketPriceUsd: 1.9, sourceUpdatedAt: new Date().toISOString() },
      },
    };
    expect(finalPriceValue(card, "nonfoil", draft[variantKey("stupefy", "nonfoil")])).toBe(30_000);
    expect(finalPriceValue(card, "foil", draft[variantKey("stupefy", "foil")])).toBe(80_000);
  });

  test("marks prices older than 48 hours as stale", () => {
    const now = Date.parse("2026-09-18T12:00:00Z");
    expect(isTcgPriceStale("2026-09-16T11:59:59Z", now)).toBe(true);
    expect(isTcgPriceStale("2026-09-16T12:00:01Z", now)).toBe(false);
  });
});
