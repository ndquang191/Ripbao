import { describe, expect, test } from "bun:test";
import {
  cardIdFromVariantKey,
  defaultFinish,
  editFor,
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
    tcgMultiplier: 0.9,
  },
  [variantKey("stupefy", "foil")]: {
    quantity: 1,
    minPrice: 80_000,
    tcgMultiplier: 1,
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
});
