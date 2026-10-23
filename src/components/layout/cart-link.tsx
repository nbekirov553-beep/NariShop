"use client";

import { HandbagSimpleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useCartCount, useHydrated } from "@/features/cart/store";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/format";

export function CartLink() {
  const { locale, dict } = useI18n();
  const hydrated = useHydrated();
  const count = useCartCount();
  const visibleCount = hydrated ? count : 0;

  return (
    <Link
      href={localePath(locale, "/cart")}
      aria-label={t(dict.nav.cartWithCount, { count: visibleCount })}
      data-cart-target
      className="group/cart relative flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-pill)] text-text transition-colors duration-300 hover:bg-fill-hover"
    >
      <HandbagSimpleIcon
        size={26}
        aria-hidden
        className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/cart:-rotate-6 group-hover/cart:scale-110"
      />
      {visibleCount > 0 && (
        <span
          key={visibleCount}
          aria-hidden
          className="animate-pop absolute bottom-1 right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-[var(--radius-pill)] bg-accent px-1 text-[10px] font-bold tabular-nums text-accent-contrast ring-2 ring-sky"
        >
          {visibleCount > 99 ? "99+" : visibleCount}
        </span>
      )}
    </Link>
  );
}
