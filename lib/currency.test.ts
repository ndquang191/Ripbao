import { describe, expect, test } from "bun:test";
import { formatCurrency, parseCurrency } from "@/lib/currency";

describe("currency helpers", () => {
  test("formats whole VND amounts", () => {
    expect(formatCurrency(125000)).toContain("125.000");
  });

  test("parses formatted VND values", () => {
    expect(parseCurrency("125.000 ₫")).toBe(125000);
    expect(parseCurrency("Liên hệ")).toBeNull();
  });
});
