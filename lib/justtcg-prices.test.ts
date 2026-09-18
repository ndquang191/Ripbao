import { describe, expect, test } from "bun:test";
import { finishFromPrinting, priceBatchCount, roundDynamicPrice } from "./justtcg-prices";

describe("JustTCG prices", () => {
  test("maps only supported printings", () => {
    expect(finishFromPrinting("Normal")).toBe("nonfoil");
    expect(finishFromPrinting("Foil")).toBe("foil");
    expect(finishFromPrinting("1st Edition")).toBeNull();
  });

  test("uses the minimum when there is no market price", () => {
    expect(roundDynamicPrice(25_000, null, 0.9)).toBe(25_000);
  });

  test("rounds the TCG component up to the next thousand", () => {
    expect(roundDynamicPrice(5_000, 1.9, 25)).toBe(48_000);
  });

  test("never prices below the seller minimum", () => {
    expect(roundDynamicPrice(60_000, 1.9, 25)).toBe(60_000);
  });

  test("splits 30 newly added cards into two free-tier requests", () => {
    expect(priceBatchCount(20)).toBe(1);
    expect(priceBatchCount(30)).toBe(2);
    expect(priceBatchCount(40)).toBe(2);
  });
});
