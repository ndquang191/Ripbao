import { describe, expect, test } from "bun:test";
import {
  formatCurrency,
  formatCurrencyInput,
  parseCurrency,
} from "@/lib/currency";

describe("currency helpers", () => {
  test("formats whole VND amounts", () => {
    expect(formatCurrency(125000)).toContain("125.000");
  });

  test("parses formatted VND values", () => {
    expect(parseCurrency("125.000 ₫")).toBe(125000);
    expect(parseCurrency("Liên hệ")).toBeNull();
  });

  test("formats values for currency inputs", () => {
    expect(formatCurrencyInput(10000)).toBe("10.000");
    expect(formatCurrencyInput(1250000)).toBe("1.250.000");
  });
});
