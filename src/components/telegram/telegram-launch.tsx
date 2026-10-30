"use client";

import { TelegramLogoIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useRef, useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import {
  getTelegramWebApp,
  markTelegramLaunch,
  TELEGRAM_SCRIPT_ID,
  TELEGRAM_SCRIPT_SRC,
} from "@/lib/telegram-webapp";

type Status = "loading" | "outside" | "error";

export function TelegramLaunch() {
  const { locale, dict } = useI18n();
  const t = dict.telegram;
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const started = useRef(false);

  const signIn = useCallback(async () => {
    const app = getTelegramWebApp();
    if (!app) {
      setStatus("outside");
      return;
    }
    markTelegramLaunch();
    app.ready();
    app.expand();
    setStatus("loading");
    try {
      const response = await fetch("/api/v1/telegram/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: app.initData }),
      });
      if (!response.ok) throw new Error(`telegram session: ${response.status}`);
      const { data } = (await response.json()) as { data: { locale: Locale | null } };
      router.replace(localePath(data.locale ?? locale));
      router.refresh();
    } catch {
      setStatus("error");
    }
  }, [locale, router]);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    void signIn();
  }, [signIn]);

  return (
    <>
      {/* Скрипт может уже грузиться из TelegramBridge: тогда next/script вызывает только onLoad, без onReady. */}
      <Script
        id={TELEGRAM_SCRIPT_ID}
        src={TELEGRAM_SCRIPT_SRC}
        onLoad={start}
        onReady={start}
        onError={() => setStatus("outside")}
      />
      {status === "loading" && (
        <p role="status" className="flex items-center gap-2 text-[15px] font-medium text-text-muted">
          <TelegramLogoIcon size={20} weight="fill" aria-hidden className="animate-pulse text-accent" />
          {t.connecting}
        </p>
      )}
      {status === "error" && (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <p role="alert" className="rounded-[var(--radius-field)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {t.error}
          </p>
          <button type="button" onClick={() => void signIn()} className={buttonStyles({ size: "lg", full: true })}>
            {t.retry}
          </button>
        </div>
      )}
      {status === "outside" && (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <h2 className="font-display text-xl font-bold">{t.outsideTitle}</h2>
          <p className="text-[15px] font-medium text-text-muted">{t.outsideText}</p>
          <Link href={localePath(locale, "/login")} className={buttonStyles({ size: "lg", full: true })}>
            {t.toLogin}
          </Link>
          <Link href={localePath(locale)} className={buttonStyles({ variant: "secondary", size: "lg", full: true })}>
            {t.toShop}
          </Link>
        </div>
      )}
    </>
  );
}
