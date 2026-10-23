import { describe, expect, it } from "vitest";
import { discountPercent, formatMoney, lineTotal } from "@/lib/money";

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
