// Минимальный интерфейс Telegram WebApp, который использует магазин:
// https://core.telegram.org/bots/webapps#initializing-mini-apps

export interface TelegramWebApp {
  initData: string;
  colorScheme: "light" | "dark";
  ready(): void;
  expand(): void;
  BackButton: {
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const TELEGRAM_SCRIPT_ID = "telegram-web-app";
export const TELEGRAM_SCRIPT_SRC = "https://telegram.org/js/telegram-web-app.js";

const LAUNCH_FLAG = "narishop:telegram";

/** WebApp, только если страница действительно открыта из Telegram (есть init data). */
export function getTelegramWebApp(): TelegramWebApp | null {
  const app = typeof window === "undefined" ? undefined : window.Telegram?.WebApp;
  return app?.initData ? app : null;
}

export function markTelegramLaunch(): void {
  sessionStorage.setItem(LAUNCH_FLAG, "1");
}

/** Скрипт Telegram грузим только внутри Mini App, обычным посетителям он не нужен. */
export function isTelegramLaunch(): boolean {
  return sessionStorage.getItem(LAUNCH_FLAG) === "1" || window.location.hash.includes("tgWebAppData");
}
