import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { AddToCartCompact } from "@/components/product/add-to-cart";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Product } from "@/server/repositories/catalog";
import { PriceBlock } from "./price-block";
import { ProductVisual } from "./product-visual";
import { StockStatus } from "./stock-status";
import { toneFor } from "./tone";

export function productIcon(product: Product): string {
  return product.category?.icon ?? "appliance";
}

export function productTransitionName(product: Product): string {
  return `product-photo-${product.id}`;
}

interface ProductCardProps {
  product: Product;
  locale: Locale;
  dict: Dictionary;
  /** Включает морфинг фото в страницу товара; только если товар на странице один раз. */
  morph?: boolean;
  eager?: boolean;
}

export function ProductCard({ product, locale, dict, morph = false, eager = false }: ProductCardProps) {
  const name = product.name[locale];
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];
  const category = product.category;
  const icon = productIcon(product);

  return (
    <article
      data-fly-scope
      className="group/card relative flex h-full flex-col rounded-[var(--radius-card)] bg-surface p-2 shadow-card transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-lift has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus">
      <div className="relative">
        <ProductVisual
          icon={icon}
          image={primaryImage ? { url: primaryImage.url, alt: primaryImage.alt[locale] } : null}
          placeholderLabel={dict.product.imagePlaceholder}
          iconSize={64}
          eager={eager}
          tone={toneFor(icon)}
          className={
            product.stockQuantity === 0
              ? "rounded-[calc(var(--radius-card)-0.5rem)] opacity-60 grayscale"
              : "rounded-[calc(var(--radius-card)-0.5rem)]"
          }
          transitionName={morph ? productTransitionName(product) : undefined}
        />
        {category && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-[var(--radius-pill)] bg-cloud/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink backdrop-blur-sm">
            {category.name[locale]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-2.5 pb-2.5 pt-3.5">
        <p className="text-[13px] font-medium text-text-muted">{product.brand}</p>
        <h3 className="line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug text-text">
          <Link
            href={localePath(locale, `/product/${product.slug}`)}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {name}
          </Link>
        </h3>
        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          <PriceBlock
            price={product.priceUzs}
            compareAt={product.compareAtPriceUzs}
            locale={locale}
            labels={dict.product}
          />
          <StockStatus quantity={product.stockQuantity} labels={dict.product} />
        </div>
        <div className="relative z-10 pt-2">
          <AddToCartCompact productId={product.id} stock={product.stockQuantity} productName={name} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  locale,
  dict,
  columns = "wide",
  morph = false,
  eagerCount = 0,
}: {
  products: Product[];
  locale: Locale;
  dict: Dictionary;
  columns?: "wide" | "narrow" | "showcase";
  morph?: boolean;
  /** Сколько первых фото грузить сразу: для сетки на первом экране. */
  eagerCount?: number;
}) {
  const layout = {
    wide: "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4",
    narrow: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3",
    showcase: "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:gap-6",
  }[columns];

  return (
    <ul className={layout}>
      {products.map((product, index) => (
        <Reveal as="li" key={product.id} index={index}>
          <ProductCard
            product={product}
            locale={locale}
            dict={dict}
            morph={morph}
            eager={index < eagerCount}
          />
        </Reveal>
      ))}
    </ul>
  );
}
