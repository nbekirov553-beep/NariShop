import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;

// Браузер — установленный Google Chrome (channel: "chrome"): на CI-раннерах GitHub он уже есть,
// локально не нужно скачивать отдельный Chromium.
// Сервер — production-сборка на in-memory БД; вход без Google включает ENABLE_TEST_LOGIN.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    channel: "chrome",
    locale: "ru-RU",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    {
      name: "mobile-320",
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 320, height: 640 }, hasTouch: true },
      testMatch: /layout\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npx next start -p ${port}`,
    url: `${baseURL}/ru`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ENABLE_TEST_LOGIN: "1",
      DATABASE_URL: "",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-only-secret-not-for-production-use-000000",
    },
  },
});
