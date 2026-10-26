import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("search → product → cart → checkout → order in account", async ({ page }) => {
  await loginAs(page, "customer");
  await page.goto("/ru");

  const search = page.getByRole("search").first().getByRole("searchbox");
  await search.fill("Sonora Pods");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/ru\/catalog\?q=Sonora/);

  await page.getByRole("link", { name: /Наушники Sonora Pods 2/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Sonora Pods 2/);

  await page.getByRole("button", { name: "В корзину", exact: true }).click();
  await page.getByRole("link", { name: "Перейти в корзину" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Корзина" })).toBeVisible();

  await page.getByRole("link", { name: "Оформить заказ" }).click();
  await page.getByLabel("Имя и фамилия").fill("Dilnoza Karimova");
  await page.getByLabel("Телефон").fill("+998 90 123 45 67");
  await page.getByRole("radio", { name: "Самовывоз" }).check();
  await page.getByRole("button", { name: "Подтвердить заказ" }).click();

  const status = page.getByRole("status").filter({ hasText: "Заказ принят" });
  await expect(status).toBeVisible();
  const number = (await status.textContent())?.match(/NS-\d+/)?.[0];
  expect(number).toBeTruthy();

  await page.getByRole("link", { name: "Мои заказы" }).click();
  await expect(page.getByRole("link", { name: new RegExp(number!) })).toBeVisible();
});

test("checkout shows field errors without losing input", async ({ page }) => {
  await page.goto("/ru/product/sonora-pods-2");
  await page.getByRole("button", { name: "В корзину", exact: true }).click();
  await page.goto("/ru/checkout");
  await page.getByLabel("Имя и фамилия").fill("Aziz");
  await page.getByLabel("Телефон").fill("+7 900");
  await page.getByRole("button", { name: "Подтвердить заказ" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByLabel("Имя и фамилия")).toHaveValue("Aziz");
  await expect(page.getByLabel("Телефон")).toHaveAttribute("aria-invalid", "true");
});
