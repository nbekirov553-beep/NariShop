"use client";

import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";
import { locales } from "@/lib/i18n/config";
import {
  getTelegramWebApp,
  isTelegramLaunch,
  TELEGRAM_SCRIPT_ID,
  TELEGRAM_SCRIPT_SRC,
  type TelegramWebApp,
} from "@/lib/telegram-webapp";

const noopSubscribe = () => () => {};

/** Внутри Telegram Mini App: системная кнопка «Назад» на всех страницах, кроме главной. */
export function TelegramBridge() {
  const pathname = usePathname();
  const router = useRouter();
  // Флаг ставит экран /tg после входа; снимок перечитывается при каждой смене страницы.
  const inTelegram = useSyncExternalStore(noopSubscribe, isTelegramLaunch, () => false);
  const [app, setApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    if (!app) return;
    const isRoot = locales.some((locale) => pathname === `/${locale}` || pathname === `/${locale}/tg`);
    if (isRoot) {
      app.BackButton.hide();
      return;
    }
    const back = () => router.back();
    app.BackButton.onClick(back);
    app.BackButton.show();
    return () => app.BackButton.offClick(back);
  }, [app, pathname, router]);

  if (!inTelegram) return null;
  return <Script id={TELEGRAM_SCRIPT_ID} src={TELEGRAM_SCRIPT_SRC} onReady={() => setApp(getTelegramWebApp())} />;
}
