import { describe, expect, it } from "vitest";
import {
  discountPercent,
  formatMoney,
  formatUsd,
  formatUsdRate,
  lineTotal,
  parseUsdRate,
  usdToUzs,
  uzsToUsd,
} from "@/lib/money";

describe("formatMoney", () => {
  it("groups digits per locale", () => {
    expect(formatMoney(12_499_000, "ru")).toBe("12\u00A0499\u00A0000\u00A0сум");
    expect(formatMoney(12_499_000, "uz")).toBe("12\u00A0499\u00A0000\u00A0so‘m");
    expect(formatMoney(12_499_000, "en")).toBe("12,499,000\u00A0UZS");
  });

  it("handles small and negative amounts", () => {
    expect(formatMoney(0, "en")).toBe("0\u00A0UZS");
    expect(formatMoney(-500, "ru")).toBe("-500\u00A0сум");
  });

  it("rejects non-integer amounts", () => {
    expect(() => formatMoney(10.5, "ru")).toThrow();
  });
});

describe("discountPercent", () => {
  it("returns rounded percent only for a real discount", () => {
    expect(discountPercent(3_290_000, 3_690_000)).toBe(11);
    expect(discountPercent(100, null)).toBeNull();
    expect(discountPercent(100, 100)).toBeNull();
    expect(discountPercent(120, 100)).toBeNull();
  });
});

describe("lineTotal", () => {
  it("multiplies integer price by quantity", () => {
    expect(lineTotal(690_000, 3)).toBe(2_070_000);
  });
});

describe("курс сум ↔ доллар", () => {
  it("разбирает USD_UZS_RATE и отклоняет пустой или неверный курс", () => {
    expect(parseUsdRate("12650")).toBe(12650);
    expect(parseUsdRate(" 12 650,5 ")).toBe(12650.5);
    expect(parseUsdRate("12_650")).toBe(12650);
    expect(parseUsdRate("")).toBeNull();
    expect(parseUsdRate(undefined)).toBeNull();
    expect(parseUsdRate("0")).toBeNull();
    expect(parseUsdRate("-1")).toBeNull();
    expect(parseUsdRate("abc")).toBeNull();
  });

  it("переводит сумы в центы и обратно с округлением", () => {
    expect(uzsToUsd(1_590_000, 12_650)).toBe(12_569);
    expect(usdToUzs(12_569, 12_650)).toBe(1_589_979);
    expect(usdToUzs(100, 12_650)).toBe(12_650);
    expect(uzsToUsd(12_650, 12_650)).toBe(100);
    expect(uzsToUsd(0, 12_650)).toBe(0);
  });

  it("форматирует доллары и курс для каждого языка", () => {
    expect(formatUsd(12_569, "en")).toBe("$125.69");
    expect(formatUsd(123_456_705, "en")).toBe("$1,234,567.05");
    expect(formatUsd(12_569, "ru")).toBe("125,69 $");
    expect(formatUsdRate(12_650, "ru")).toBe("1 $ = 12 650 сум");
    expect(formatUsdRate(12_650.4, "en")).toBe("1 $ = 12,650 UZS");
  });
});
