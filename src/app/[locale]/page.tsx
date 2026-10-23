import { ArrowUpRightIcon, ShieldCheckIcon, TruckIcon, WalletIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/catalog/category-icon";
import { ProductCard, ProductGrid } from "@/components/catalog/product-card";
import { toneFor } from "@/components/catalog/tone";
import { Hero } from "@/components/home/hero";
import { Reveal } from "@/components/motion/reveal";
import { Faq } from "@/components/ui/faq";
import { localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/dictionaries";
import { plural } from "@/lib/i18n/format";
import {
  countProductsByCategory,
  getDealProducts,
  getPopularProducts,
  getProductBySlug,
  listCategories,
} from "@/server/repositories/catalog";

const HERO_PRODUCT_SLUG = "sonora-studio";

const advantageTones = ["bg-pastel-pink", "bg-pastel-lavender", "bg-pastel-butter"];

export default async function HomePage() {
  const [{ locale, dict }, categories, counts, deals, popular, spotlight] = await Promise.all([
    getI18n(),
    listCategories(),
    countProductsByCategory(),
    getDealProducts(8),
    getPopularProducts(6),
    getProductBySlug(HERO_PRODUCT_SLUG),
  ]);

  const catalogHref = localePath(locale, "/catalog");

  const advantages = [
    { Icon: TruckIcon, title: dict.home.deliveryTitle, text: dict.home.deliveryText },
    { Icon: ShieldCheckIcon, title: dict.home.warrantyTitle, text: dict.home.warrantyText },
    { Icon: WalletIcon, title: dict.home.paymentTitle, text: dict.home.paymentText },
  ];

  const showAllLink = (
    <Link
      href={catalogHref}
      className="group/more inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-pill)] bg-fill px-5 text-sm font-semibold text-text transition-colors duration-300 hover:bg-fill-hover"
    >
      {dict.home.showAll}
      <ArrowUpRightIcon
        size={15}
        weight="bold"
        aria-hidden
        className="transition-transform duration-300 group-hover/more:rotate-45"
      />
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <Hero locale={locale} dict={dict} spotlight={spotlight} />

      <div className="sheet sheet-sky flex flex-col gap-20 lg:gap-28">
        <section aria-labelledby="home-featured" className="flex flex-col gap-8 lg:gap-12">
          <Reveal className="flex flex-col items-center gap-4 text-center">
            <span className="rounded-[var(--radius-pill)] bg-pastel-lavender px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-ink">
              {dict.home.featuredEyebrow}
            </span>
            <h2
              id="home-featured"
              className="max-w-[18ch] font-display text-[clamp(2.1rem,5.2vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.045em]"
            >
              {dict.home.featuredTitle}
            </h2>
            <p className="text-base font-medium text-text-muted sm:text-lg">{dict.home.featuredText}</p>
          </Reveal>
          <ProductGrid products={popular} locale={locale} dict={dict} columns="showcase" />
          <div className="flex justify-center">{showAllLink}</div>
        </section>

        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {advantages.map(({ Icon, title, text }, index) => (
            <Reveal
              as="li"
              key={title}
              index={index}
              className={`flex items-start gap-4 rounded-[var(--radius-card)] p-5 text-ink sm:p-6 ${advantageTones[index]}`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cloud/70">
                <Icon size={22} weight="duotone" aria-hidden />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">{title}</span>
                <span className="text-sm text-ink/70">{text}</span>
              </span>
            </Reveal>
          ))}
        </ul>

        <section id="collections" aria-labelledby="home-collections" className="flex scroll-mt-28 flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2
              id="home-collections"
              className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.04em]"
            >
              {dict.home.collectionsTitle}
            </h2>
            <p className="text-[15px] font-medium text-text-muted sm:text-base">{dict.home.collectionsText}</p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {categories.map((category, index) => (
              <Reveal as="li" key={category.id} index={index}>
                <Link
                  href={localePath(locale, `/catalog/${category.slug}`)}
                  className={`group/tile relative isolate flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-4 text-ink transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-lift ${toneFor(category.icon)}`}
                >
                  <span className="relative z-10 flex flex-col gap-0.5">
                    <span className="text-[15px] font-bold leading-snug">{category.name[locale]}</span>
                    <span className="text-[13px] font-medium text-ink/65">
                      {plural(locale, counts[category.id] ?? 0, dict.catalog.products)}
                    </span>
                  </span>
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt=""
                      width={320}
                      height={320}
                      sizes="(min-width: 1024px) 14rem, (min-width: 640px) 30vw, 46vw"
                      className="sky-fade absolute inset-x-0 bottom-0 -z-10 w-full mix-blend-multiply transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/tile:-translate-y-1 group-hover/tile:scale-105"
                    />
                  ) : (
                    <CategoryIcon icon={category.icon} size={40} weight="duotone" className="self-end text-ink/45" />
                  )}
                  <span className="relative z-10 flex size-9 items-center justify-center self-end rounded-full bg-cloud/80 transition-transform duration-500 group-hover/tile:rotate-45">
                    <ArrowUpRightIcon size={16} weight="bold" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>

        {deals.length > 0 && (
          <section aria-labelledby="home-deals" className="flex flex-col gap-6">
            <div className="flex items-end justify-between gap-4">
              <h2
                id="home-deals"
                className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.04em]"
              >
                {dict.home.dealsTitle}
              </h2>
              <div className="hidden sm:block">{showAllLink}</div>
            </div>
            <ul className="-mx-[clamp(1rem,3vw,2.75rem)] flex snap-x snap-mandatory scroll-px-[clamp(1rem,3vw,2.75rem)] gap-3 overflow-x-auto px-[clamp(1rem,3vw,2.75rem)] pb-4 pt-1 sm:gap-4">
              {deals.map((product, index) => (
                <Reveal
                  as="li"
                  key={product.id}
                  index={index}
                  className="w-[62%] shrink-0 snap-start sm:w-[38%] md:w-[30%] lg:w-[22%] xl:w-[19%]"
                >
                  <ProductCard product={product} locale={locale} dict={dict} />
                </Reveal>
              ))}
            </ul>
          </section>
        )}

        <Reveal>
          <section aria-labelledby="home-faq" className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <h2
              id="home-faq"
              className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.04em]"
            >
              {dict.home.faqTitle}
            </h2>
            <Faq items={dict.home.faq} name="home-faq" />
          </section>
        </Reveal>
      </div>
    </div>
  );
}
