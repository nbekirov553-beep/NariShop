import Link from "next/link";
import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/format";

export const tableStyles = {
  // relative: sr-only подписи (position: absolute) иначе выходят за прокрутку и расширяют страницу.
  wrap: "relative overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface",
  table: "w-full min-w-[40rem] border-collapse text-left text-[14px]",
  th: "border-b border-border px-4 py-3 text-[13px] font-semibold text-text-muted",
  td: "border-b border-border px-4 py-3 align-middle",
  link: "font-semibold underline-offset-4 hover:underline focus-visible:underline",
};

export function AdminSection({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-10 text-center text-[15px] text-text-muted">
      {children}
    </p>
  );
}

export function Pagination({
  page,
  pageCount,
  hrefFor,
  dict,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  dict: Dictionary;
}) {
  if (pageCount <= 1) return null;
  const linkClass = buttonStyles({ variant: "secondary", size: "sm" });
  const disabled = cn(linkClass, "pointer-events-none opacity-50");
  return (
    <nav aria-label={t(dict.admin.pageOf, { page, count: pageCount })} className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          {dict.admin.prev}
        </Link>
      ) : (
        <span aria-hidden className={disabled}>
          {dict.admin.prev}
        </span>
      )}
      <span className="text-sm text-text-muted">{t(dict.admin.pageOf, { page, count: pageCount })}</span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>
          {dict.admin.next}
        </Link>
      ) : (
        <span aria-hidden className={disabled}>
          {dict.admin.next}
        </span>
      )}
    </nav>
  );
}

/** Ссылка с сохранением текущих фильтров в query. */
export function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && !(key === "page" && value === 1)) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
