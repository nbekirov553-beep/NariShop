import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { catalogHref, type CatalogState } from "@/features/catalog/href";
import { t } from "@/lib/i18n/format";
import { cn } from "@/lib/cn";

interface PaginationProps {
  basePath: string;
  state: CatalogState;
  page: number;
  pageCount: number;
  labels: { prev: string; next: string; pageOf: string; pagination: string };
}

export function Pagination({ basePath, state, page, pageCount, labels }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  const pageLink = (target: number) => catalogHref(basePath, state, { page: target });

  return (
    <nav aria-label={labels.pagination} className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={pageLink(page - 1)} className={buttonStyles({ variant: "secondary", size: "sm" })}>
          <CaretLeftIcon size={14} aria-hidden />
          {labels.prev}
        </Link>
      )}
      <ul className="flex items-center gap-1">
        {pages.map((target) => (
          <li key={target}>
            <Link
              href={pageLink(target)}
              aria-current={target === page ? "page" : undefined}
              aria-label={t(labels.pageOf, { page: target, count: pageCount })}
              className={cn(
                "flex size-9 items-center justify-center rounded-[var(--radius-pill)] text-sm font-semibold tabular-nums transition-colors",
                target === page ? "bg-text text-bg" : "text-text-muted hover:bg-surface-muted hover:text-text",
              )}
            >
              {target}
            </Link>
          </li>
        ))}
      </ul>
      {page < pageCount && (
        <Link href={pageLink(page + 1)} className={buttonStyles({ variant: "secondary", size: "sm" })}>
          {labels.next}
          <CaretRightIcon size={14} aria-hidden />
        </Link>
      )}
    </nav>
  );
}
