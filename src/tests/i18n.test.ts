import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import uz from "@/messages/uz.json";
import { plural, t } from "@/lib/i18n/format";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return [`${prefix}[${value.length}]`, ...value.flatMap((item, index) => keyPaths(item, `${prefix}[${index}]`))];
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

describe("dictionaries", () => {
  it("uz and en have exactly the same keys as ru", () => {
    const reference = keyPaths(ru).sort();
    expect(keyPaths(uz).sort()).toEqual(reference);
    expect(keyPaths(en).sort()).toEqual(reference);
  });
});

describe("format helpers", () => {
  it("substitutes variables", () => {
    expect(t("Осталось {count} шт.", { count: 3 })).toBe("Осталось 3 шт.");
  });

  it("picks Russian plural forms", () => {
    expect(plural("ru", 1, ru.catalog.products)).toBe("1 товар");
    expect(plural("ru", 3, ru.catalog.products)).toBe("3 товара");
    expect(plural("ru", 11, ru.catalog.products)).toBe("11 товаров");
    expect(plural("en", 1, en.catalog.products)).toBe("1 product");
    expect(plural("uz", 5, uz.catalog.products)).toBe("5 ta mahsulot");
  });
});
