"use client";

import { ShoppingCartSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Button, buttonStyles } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";

export function CartEmpty() {
  const { locale, dict } = useI18n();
  return (
    <div className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-8 sm:p-12">
      <ShoppingCartSimpleIcon size={44} weight="duotone" aria-hidden className="text-text-muted" />
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold">{dict.cart.emptyTitle}</h2>
        <p className="max-w-[50ch] text-[15px] text-text-muted">{dict.cart.emptyText}</p>
      </div>
      <Link href={localePath(locale, "/catalog")} className={buttonStyles()}>
        {dict.home.heroCta}
      </Link>
    </div>
  );
}

export function CartError({ onRetry }: { onRetry: () => void }) {
  const { dict } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] bg-danger-soft p-6">
      <p className="flex items-start gap-2 text-[15px] font-medium text-danger">
        <WarningCircleIcon size={20} weight="bold" aria-hidden className="mt-0.5 shrink-0" />
        {dict.cart.loadError}
      </p>
      <Button variant="secondary" onClick={onRetry}>
        {dict.cart.retry}
      </Button>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-hidden>
      <div className="flex flex-col gap-3">
        {[0, 1].map((index) => (
          <div key={index} className="flex gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <div className="size-24 skeleton rounded-[var(--radius-field)] bg-surface-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-2/3 skeleton rounded-full bg-surface-muted" />
              <div className="h-4 w-1/3 skeleton rounded-full bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-64 skeleton rounded-[var(--radius-card)] bg-surface-muted" />
    </div>
  );
}
