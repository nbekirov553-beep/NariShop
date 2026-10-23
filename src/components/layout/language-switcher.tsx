"use client";

import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useI18n } from "@/lib/i18n/client";
import { LOCALE_COOKIE, localeNames, locales, localeShort, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";

function swapLocale(pathname: string, next: Locale): string {
  const segments = pathname.split("/");
  segments[1] = next;
  return segments.join("/") || `/${next}`;
}

function persistLocale(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
}

// Язык задаёт корневой layout (<html lang>, шрифты, метаданные), поэтому переход
// идёт обычной ссылкой с полной загрузкой документа, а не клиентской навигацией.
export function LanguageSwitcher({ withLabels = false }: { withLabels?: boolean }) {
  const { locale, dict } = useI18n();
  const pathname = usePathname();

  function onSelect(event: MouseEvent<HTMLAnchorElement>, next: Locale) {
    if (next === locale) {
      event.preventDefault();
      return;
    }
    persistLocale(next);
    event.currentTarget.search = window.location.search;
  }

  return (
    <nav aria-label={dict.nav.language}>
      <ul className="inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] bg-fill p-0.5">
        {locales.map((item) => {
          const href = swapLocale(pathname, item);
          const active = item === locale;
          return (
            <li key={item}>
              <a
                href={href}
                hrefLang={item}
                lang={item}
                aria-current={active ? "true" : undefined}
                aria-label={withLabels ? undefined : localeNames[item]}
                onClick={(event) => onSelect(event, item)}
                className={cn(
                  "flex h-8 items-center justify-center rounded-[var(--radius-pill)] text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-200",
                  withLabels ? "px-3" : "w-9",
                  active ? "bg-surface text-text shadow-card" : "text-vibrant hover:text-text",
                )}
              >
                {withLabels ? localeNames[item] : localeShort[item]}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
