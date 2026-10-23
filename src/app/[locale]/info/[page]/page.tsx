import { InfoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/dictionaries";
import { infoPages, isInfoPage } from "@/lib/info-pages";
import { cn } from "@/lib/cn";

type Props = PageProps<"/[locale]/info/[page]">;

export function generateStaticParams() {
  return infoPages.map((page) => ({ page }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const { dict } = await getI18n();
  return isInfoPage(page) ? { title: dict.info.pages[page].title } : {};
}

export default function InfoPage({ params }: Props) {
  return (
    <div className="sheet">
      <Suspense fallback={<div className="h-10 w-56 skeleton rounded-full bg-surface-muted" />}>
        <InfoContent params={params} />
      </Suspense>
    </div>
  );
}

async function InfoContent({ params }: Pick<Props, "params">) {
  const [{ page }, { locale, dict }] = await Promise.all([params, getI18n()]);
  if (!isInfoPage(page)) notFound();
  const content = dict.info.pages[page];

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label={dict.footer.buyers} className="order-2 lg:order-1">
        <ul className="-mx-2 flex flex-col">
          {infoPages.map((item) => (
            <li key={item}>
              <Link
                href={localePath(locale, `/info/${item}`)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center rounded-[var(--radius-field)] px-2 text-[15px] transition-colors",
                  item === page ? "bg-surface-muted font-semibold" : "text-text-muted hover:text-text",
                )}
              >
                {dict.info.pages[item].title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <article className="order-1 flex max-w-[68ch] flex-col gap-5 lg:order-2">
        <Breadcrumbs
          label={dict.footer.buyers}
          items={[{ name: dict.nav.home, href: localePath(locale) }, { name: content.title }]}
        />
        <h1 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl">{content.title}</h1>
        <p className="flex items-start gap-2 rounded-[var(--radius-field)] bg-warning-soft px-4 py-3 text-sm text-warning">
          <InfoIcon size={18} weight="bold" aria-hidden className="mt-0.5 shrink-0" />
          {dict.info.draft}
        </p>
        {content.body.map((paragraph) => (
          <p key={paragraph} className="text-base leading-relaxed">
            {paragraph}
          </p>
        ))}
      </article>
    </div>
  );
}
