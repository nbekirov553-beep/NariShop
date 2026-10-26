import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

const publicPages = ["/ru", "/uz/catalog", "/en/product/sonora-pods-2", "/ru/cart", "/ru/checkout", "/ru/login", "/ru/info/delivery"];
const privatePages = ["/ru/account", "/ru/admin", "/ru/admin/orders", "/ru/admin/products", "/ru/admin/products/p-012", "/ru/admin/audit"];

async function expectNoHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(0);
}

for (const path of publicPages) {
  test(`no horizontal scroll: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expectNoHorizontalScroll(page);
  });
}

test("private pages fit the viewport", async ({ page }) => {
  await loginAs(page, "admin");
  for (const path of privatePages) {
    await page.goto(path);
    await expectNoHorizontalScroll(page);
  }
});

test("keyboard: skip link is the first stop and moves focus to main", async ({ page }) => {
  await page.goto("/ru");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Перейти к содержимому" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("keyboard: interactive elements have a visible focus indicator", async ({ page }) => {
  await page.goto("/ru/catalog");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const visible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return true;
      // Карточка товара подсвечивает себя целиком (has-[a:focus-visible]) — проверяем и предков.
      for (let node: HTMLElement | null = el, depth = 0; node && depth < 4; node = node.parentElement, depth++) {
        const style = getComputedStyle(node);
        if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) return true;
        if (node === el && style.boxShadow !== "none") return true;
      }
      return false;
    });
    expect(visible, `focus indicator on tab stop ${i + 1}`).toBe(true);
  }
});
