export const currencyConfig = {
  code: "VND",
  locale: "vi-VN",
  symbol: "₫",
  inputStep: 1_000,
  legacyUsdToCurrentRate: 25_000,
  quickMinimums: { common: 5_000, uncommon: 10_000, rare: 25_000, epic: 75_000, legendary: 200_000 } as Record<string, number>,
} as const;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat(currencyConfig.locale, {
    style: "currency",
    currency: currencyConfig.code,
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseCurrency(value: string) {
  if (!value || value.toLocaleLowerCase("vi").includes("liên hệ")) return null;

  const legacyUsd = value.match(/^\$([\d,.]+)$/);
  if (legacyUsd) {
    const amount = Number(legacyUsd[1].replaceAll(",", ""));
    return Number.isFinite(amount) ? amount * currencyConfig.legacyUsdToCurrentRate : null;
  }

  const amount = Number(value.replace(/[^\d-]/g, ""));
  return Number.isFinite(amount) ? amount : null;
}
