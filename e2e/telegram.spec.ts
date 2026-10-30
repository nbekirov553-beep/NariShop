import { expect, test, type Page } from "@playwright/test";
import { signInitData } from "../src/server/telegram";
import { E2E_TELEGRAM_BOT_TOKEN } from "../playwright.config";

const TELEGRAM_SCRIPT = "https://telegram.org/js/telegram-web-app.js";

/** Подменяет скрипт Telegram: WebApp с init data, подписанной тестовым токеном бота. */
async function openAsMiniApp(page: Page, initData: string) {
  await page.route(TELEGRAM_SCRIPT, async (route) => {
    // Как в настоящем Telegram: скрипт грузится не мгновенно, его одновременно ждут экран /tg и TelegramBridge.
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({
      contentType: "text/javascript",
      body: `
        window.__tg = { ready: 0, expanded: 0, back: "hidden" };
        window.Telegram = { WebApp: {
          initData: ${JSON.stringify(initData)},
          colorScheme: "light",
          ready() { window.__tg.ready++; },
          expand() { window.__tg.expanded++; },
          BackButton: {
            show() { window.__tg.back = "shown"; },
            hide() { window.__tg.back = "hidden"; },
            onClick() {}, offClick() {},
          },
        } };`,
    });
  });
  await page.goto(`/ru/tg#tgWebAppData=${encodeURIComponent(initData)}&tgWebAppVersion=8.0`);
}

const telegramState = (page: Page) => page.evaluate(() => (window as unknown as { __tg: Record<string, unknown> }).__tg);

test("mini app: verified init data signs in and opens the store in the Telegram language", async ({ page }) => {
  const user = { id: 42_000_001, first_name: "Telegram", last_name: "Buyer", language_code: "en" };
  const initData = signInitData(
    { auth_date: String(Math.floor(Date.now() / 1000)), query_id: "AAE2E", user: JSON.stringify(user) },
    E2E_TELEGRAM_BOT_TOKEN,
  );

  await openAsMiniApp(page, initData);
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
  expect(await telegramState(page)).toMatchObject({ ready: 1, expanded: 1, back: "hidden" });

  // После перезагрузки внутри Mini App скрипт Telegram подключается снова, на внутренней странице видна «Назад».
  await page.goto("/en/account");
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Telegram");
  await expect.poll(async () => (await telegramState(page))?.back).toBe("shown");
});

test("mini app: forged init data is rejected", async ({ page }) => {
  const forged = signInitData(
    { auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify({ id: 1, first_name: "Admin" }) },
    "000:not-the-bot-token",
  );
  await openAsMiniApp(page, forged);
  await expect(page.getByRole("alert").filter({ hasText: "Не удалось войти через Telegram" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Войти", exact: true })).toBeVisible();
});

test("mini app page outside Telegram suggests Google sign-in", async ({ page }) => {
  await page.route(TELEGRAM_SCRIPT, (route) =>
    route.fulfill({ contentType: "text/javascript", body: "window.Telegram = { WebApp: { initData: '' } };" }),
  );
  await page.goto("/ru/tg");
  await expect(page.getByRole("heading", { name: "Откройте магазин в Telegram" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Войти через Google" })).toHaveAttribute("href", "/ru/login");
});
