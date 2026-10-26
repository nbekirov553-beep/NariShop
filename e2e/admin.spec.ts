import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("guests are sent to login, customers don't see the admin panel", async ({ page }) => {
  await page.goto("/ru/admin");
  await expect(page).toHaveURL(/\/ru\/login\?callbackUrl=%2Fru%2Fadmin/);

  // notFound() внутри Suspense приходит после оболочки страницы, поэтому проверяем содержимое, а не HTTP-статус.
  await loginAs(page, "customer");
  await page.goto("/ru/admin");
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Админ-панель" })).toHaveCount(0);
});

test("admin confirms an order, cancels it and sees it in the audit log", async ({ page }) => {
  await loginAs(page, "customer");
  const created = await page.request.post("/api/v1/orders", {
    data: {
      idempotencyKey: crypto.randomUUID(),
      items: [{ productId: "p-012", quantity: 1 }],
      checkout: { name: "Aziz Rahimov", phone: "+998901112233", deliveryMethod: "pickup", paymentMethod: "cash" },
    },
  });
  expect(created.status()).toBe(201);
  const { data } = (await created.json()) as { data: { orderNumber: string } };

  await page.context().clearCookies();
  await loginAs(page, "admin");
  await page.goto("/ru/admin/orders");
  const main = page.getByRole("main");
  await main.getByLabel("Номер, имя или телефон").fill(data.orderNumber);
  await main.getByRole("button", { name: "Найти" }).click();
  await expect(page).toHaveURL(new RegExp(`q=${data.orderNumber}`));
  await main.getByRole("link", { name: data.orderNumber }).click();

  await page.getByLabel("Статус заказа").selectOption("confirmed");
  await page.getByRole("button", { name: "Применить" }).first().click();
  await expect(page.getByText("Подтверждён").first()).toBeVisible();

  await page.getByLabel("Статус заказа").selectOption("cancelled");
  await page.getByRole("button", { name: "Применить" }).first().click();
  await expect(page.getByText("Отменён").first()).toBeVisible();

  await page.getByRole("link", { name: "Журнал" }).click();
  await expect(page.getByRole("link", { name: data.orderNumber }).first()).toBeVisible();
});

test("admin creates a product and finds it in the store", async ({ page }) => {
  await loginAs(page, "admin");
  const suffix = Date.now().toString(36);
  await page.goto("/ru/admin/products/new");

  await page.getByLabel("Артикул").fill(`E2E-${suffix}`);
  await page.getByLabel("Адрес страницы (slug)").fill(`e2e-speaker-${suffix}`);
  await page.getByLabel("Бренд").fill("E2Ebrand");
  for (const [lang, name] of [
    ["uz", `E2E karnay ${suffix}`],
    ["ru", `Колонка E2E ${suffix}`],
    ["en", `E2E speaker ${suffix}`],
  ]) {
    await page.locator(`#name-${lang}`).fill(name);
    await page.locator(`#description-${lang}`).fill("Описание");
  }
  await page.getByLabel("Цена, сум", { exact: true }).fill("990000");
  await page.getByLabel("Остаток, шт.").fill("4");
  await page.getByRole("checkbox", { name: "Наушники и колонки" }).check();

  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page).toHaveURL(/\/ru\/admin\/products\/p-/);

  await page.goto(`/ru/catalog?q=${encodeURIComponent(`Колонка E2E ${suffix}`)}`);
  await expect(page.getByRole("link", { name: new RegExp(`Колонка E2E ${suffix}`) }).first()).toBeVisible();
});

test("product form keeps input and shows errors on invalid data", async ({ page }) => {
  await loginAs(page, "admin");
  await page.goto("/ru/admin/products/new");
  await page.getByLabel("Артикул").fill("x");
  await page.getByLabel("Бренд").fill("Keep me");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Латиница, цифры и дефис, 3–40 символов.").first()).toBeVisible();
  await expect(page.getByLabel("Бренд")).toHaveValue("Keep me");
  await expect(page.getByText("Выберите хотя бы одну категорию.")).toBeVisible();
});
