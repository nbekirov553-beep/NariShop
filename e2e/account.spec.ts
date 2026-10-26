import path from "node:path";
import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("profile: details, avatar upload/remove and checkout prefill", async ({ page }) => {
  await loginAs(page, "customer");
  await page.goto("/ru/account");
  const profile = page.getByRole("region", { name: "Профиль" });

  await expect(profile.getByLabel("Имя", { exact: true })).toHaveValue("E2E");
  await expect(profile.getByLabel("Фамилия")).toHaveValue("customer");

  // Ошибки валидации не стирают введённое.
  await profile.getByLabel("Имя", { exact: true }).fill("Дилноза");
  await profile.getByLabel("Фамилия").fill("Каримова");
  await profile.getByLabel("Телефон").fill("+998 90 12");
  await profile.getByRole("button", { name: "Сохранить" }).click();
  await expect(profile.getByText("Телефон в формате +998 XX XXX XX XX.")).toBeVisible();
  await expect(profile.getByLabel("Фамилия")).toHaveValue("Каримова");

  await profile.getByLabel("Телефон").fill("+998 90 123 45 67");
  await profile.getByLabel("Дата рождения").fill("1996-05-20");
  await profile.getByLabel("Город").fill("Самарканд");
  await profile.getByLabel("Адрес", { exact: true }).fill("ул. Регистан, 7");
  await profile.getByRole("button", { name: "Сохранить" }).click();
  await expect(profile.getByRole("status").filter({ hasText: "Сохранено" })).toBeVisible();
  // Своё фото: JPG обрезается в браузере и уходит на сервер.
  await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "../src/assets/hero-sky-headphones.jpg"));
  await expect(profile.getByText("Фото обновлено")).toBeVisible();
  const avatar = profile.locator('img[src^="/api/v1/avatars/"]');
  await expect(avatar).toBeVisible();
  await expect(page.getByRole("button", { name: "Меню аккаунта" }).locator('img[src^="/api/v1/avatars/"]')).toBeVisible();
  const response = await page.request.get((await avatar.getAttribute("src")) ?? "");
  expect(response.headers()["content-type"]).toMatch(/^image\/(webp|jpeg)$/);

  // Не-изображение отклоняется ещё в браузере.
  await page.locator('input[type="file"]').setInputFiles({ name: "note.txt", mimeType: "text/plain", buffer: Buffer.from("hi") });
  await expect(profile.getByText("Подходят только JPG, PNG или WebP.")).toBeVisible();

  await page.reload();
  await expect(profile.getByLabel("Город")).toHaveValue("Самарканд");
  await page.screenshot({ path: "test-results/account-profile.png", fullPage: true });

  await profile.getByRole("button", { name: "Удалить" }).click();
  await expect(profile.getByText("Фото удалено")).toBeVisible();
  await expect(profile.locator('img[src^="/api/v1/avatars/"]')).toHaveCount(0);

  // Данные профиля подставляются при оформлении заказа.
  await page.goto("/ru/product/sonora-studio");
  await page.getByRole("button", { name: "В корзину", exact: true }).click();
  await expect(page.getByRole("link", { name: "Перейти в корзину" })).toBeVisible();
  await page.goto("/ru/checkout");
  await expect(page.getByLabel("Имя и фамилия")).toHaveValue("Дилноза Каримова");
  await expect(page.getByLabel("Телефон")).toHaveValue("+998901234567");
  await expect(page.getByLabel("Город")).toHaveValue("Самарканд");
});
