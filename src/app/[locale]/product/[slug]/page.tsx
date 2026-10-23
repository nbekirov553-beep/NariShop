import { InfoIcon, ShieldCheckIcon, TruckIcon, WalletIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { PriceBlock } from "@/components/catalog/price-block";
import { ProductGrid, productIcon, productTransitionName } from "@/components/catalog/product-card";
import { ProductVisual } from "@/components/catalog/product-visual";
import { StockStatus } from "@/components/catalog/stock-status";
import { toneFor } from "@/components/catalog/tone";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Reveal } from "@/components/motion/reveal";
import { AddToCartPanel } from "@/components/product/add-to-cart";
import { Faq } from "@/components/ui/faq";
import { localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/format";
import {
  getProductBySlug,
  getSimilarProducts,
  listAllProductSlugs,
  listCategories,
} from "@/server/repositories/catalog";

type Props = PageProps<"/[locale]/product/[slug]">;

export async function generateStaticParams() {
  const slugs = await listAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ locale }, product] = await Promise.all([getI18n(), getProductBySlug(slug)]);
  if (!product) return {};
  return {
    title: product.name[locale],
    description: product.description[locale],
    alternates: { canonical: `/${locale}/product/${product.slug}` },
  };
}

export default function ProductPage({ params }: Props) {
  return (
    <div className="sheet">
      <Suspense
        fallback={
          <ViewTransition exit="fade-out" default="none">
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="skeleton aspect-square rounded-[var(--radius-card)]" />
              <div className="flex flex-col gap-4">
                <div className="skeleton h-8 w-3/4 rounded-full" />
                <div className="skeleton h-10 w-1/2 rounded-full" />
              </div>
            </div>
          </ViewTransition>
        }
      >
        <ViewTransition enter="slide-up" default="none">
          <ProductContent params={params} />
        </ViewTransition>
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const [{ locale, dict }, product, categories] = await Promise.all([
    getI18n(),
    getProductBySlug(slug),
    listCategories(),
  ]);
  if (!product) notFound();

  const similar = await getSimilarProducts(product, 4);
  const category = categories.find((item) => product.categoryIds.includes(item.id));
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];
  const valueOf = (value: string | Record<string, string>) =>
    typeof value === "string" ? value : value[locale];

  const facts = [
    { Icon: ShieldCheckIcon, text: t(dict.product.warranty, { months: product.warrantyMonths }) },
    { Icon: TruckIcon, text: dict.product.deliveryShort },
    { Icon: WalletIcon, text: dict.checkout.paymentNote },
  ];

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-5">
        <Breadcrumbs
          label={dict.nav.catalog}
          items={[
            { name: dict.nav.home, href: localePath(locale) },
            { name: dict.catalog.title, href: localePath(locale, "/catalog") },
            ...(category
              ? [{ name: category.name[locale], href: localePath(locale, `/catalog/${category.slug}`) }]
              : []),
            { name: product.name[locale] },
          ]}
        />

        <div data-fly-scope className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
          <ProductVisual
            icon={productIcon(product)}
            image={primaryImage ? { url: primaryImage.url, alt: primaryImage.alt[locale] } : null}
            placeholderLabel={dict.product.imagePlaceholder}
            sizes="(min-width: 1024px) 50vw, 100vw"
            iconSize={160}
            eager
            tone={toneFor(productIcon(product))}
            className="rounded-[var(--radius-frame)]"
            transitionName={productTransitionName(product)}
          />

          <div className="animate-enter flex flex-col gap-6 [--i:1]">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-muted">{product.brand}</p>
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-[2rem]">
                {product.name[locale]}
              </h1>
              <p className="text-[13px] text-text-muted">
                {dict.product.sku}: <span className="tabular-nums">{product.sku}</span>
              </p>
            </div>

            <div className="flex flex-col gap-2 border-y border-border py-5">
              <PriceBlock
                price={product.priceUzs}
                compareAt={product.compareAtPriceUzs}
                locale={locale}
                labels={dict.product}
                size="lg"
              />
              <StockStatus quantity={product.stockQuantity} labels={dict.product} className="text-sm" />
            </div>

            <AddToCartPanel productId={product.id} stock={product.stockQuantity} />

            <ul className="flex flex-col gap-3">
              {facts.map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-[15px]">
                  <Icon size={22} weight="duotone" aria-hidden className="shrink-0 text-accent" />
                  {text}
                </li>
              ))}
            </ul>

            <p className="flex items-start gap-2 rounded-[var(--radius-field)] bg-warning-soft px-4 py-3 text-sm text-warning">
              <InfoIcon size={18} weight="bold" aria-hidden className="mt-0.5 shrink-0" />
              {dict.product.demoNotice}
            </p>
          </div>
        </div>
      </div>

      <Reveal>
        <section aria-labelledby="product-about" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-3">
            <h2 id="product-about" className="font-display text-xl font-semibold">
              {dict.product.description}
            </h2>
            <p className="max-w-[60ch] text-[15px] text-text-muted">{product.description[locale]}</p>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-semibold">{dict.product.specs}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {product.specifications.map((group) => (
                <div
                  key={group.group}
                  className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
                >
                  <h3 className="mb-3 text-sm font-semibold text-text-muted">
                    {dict.specs.groups[group.group]}
                  </h3>
                  <dl className="flex flex-col gap-2.5">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex items-baseline justify-between gap-4 text-[15px]">
                        <dt className="text-text-muted">{dict.specs.keys[item.key]}</dt>
                        <dd className="text-right font-medium">{valueOf(item.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section aria-labelledby="product-faq" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <h2 id="product-faq" className="font-display text-xl font-semibold">
            {dict.product.faqTitle}
          </h2>
          <Faq items={dict.product.faq} name="product-faq" />
        </section>
      </Reveal>

      {similar.length > 0 && (
        <section aria-labelledby="product-similar" className="flex flex-col gap-5">
          <h2 id="product-similar" className="font-display text-2xl font-semibold tracking-tight">
            {dict.product.similar}
          </h2>
          <ProductGrid products={similar} locale={locale} dict={dict} morph />
        </section>
      )}
    </div>
  );
}
