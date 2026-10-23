import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import heroImage from "@/assets/hero-sky-headphones.jpg";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { localePath, type Locale } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/server/repositories/catalog";
import { FloatingTags } from "./floating-tags";
import { HeroStage } from "./hero-stage";

interface HeroProps {
  locale: Locale;
  dict: Dictionary;
  /** Товар, снятый на hero-фото: карточка «В кадре» ведёт на его страницу. */
  spotlight: Product | null;
}

export function Hero({ locale, dict, spotlight }: HeroProps) {
  const spotlightImage = spotlight?.images.find((image) => image.isPrimary) ?? spotlight?.images[0];

  return (
    <HeroStage labelledBy="hero-title" className="sky-frame hero-frame">
      <div aria-hidden className="hero-photo parallax z-0" style={{ "--depth": "-14px" } as CSSProperties}>
        <div className="hero-levitate">
          <Image
            src={heroImage}
            alt=""
            fill
            placeholder="blur"
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 100vw, (min-width: 768px) 140vw, 220vw"
            className="object-cover"
          />
          {[0, 1, 2].map((index) => (
            <span key={index} className="hero-ring" style={{ "--i": index } as CSSProperties} />
          ))}
        </div>
      </div>

      <FloatingTags labels={dict.home.tags} />

      <div
        className="hero-copy parallax relative z-[3] flex flex-col items-center px-5 pt-[calc(var(--header-h)+1.75rem)] text-center text-hero-ink md:pt-[calc(var(--header-h)+2.5rem)]"
        style={{ "--depth": "6px" } as CSSProperties}
      >
        <p className="animate-enter text-[11px] font-bold uppercase tracking-[0.24em] sm:text-[13px]">
          {dict.home.heroEyebrow}
        </p>
        <h1
          id="hero-title"
          className="animate-enter mt-3 font-display text-[clamp(2.6rem,12.5vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.045em] md:mt-4 md:text-[min(8vw,10.5svh,6.75rem)] lg:text-[min(6.4vw,10.5svh,6.75rem)]"
          style={{ "--i": 1 } as CSSProperties}
        >
          <span className="word-capsule">{dict.home.heroHighlight}</span>
          <br />
          {dict.home.heroRest}
        </h1>
        <div
          className="animate-enter mt-5 flex flex-col items-center gap-4 md:mt-6 md:flex-row md:gap-6"
          style={{ "--i": 2 } as CSSProperties}
        >
          <p className="max-w-[28ch] text-[15px] font-medium leading-snug opacity-80 md:max-w-[24ch] md:text-left md:text-base">
            {dict.home.heroText}
          </p>
          <Link
            href={localePath(locale, "/catalog")}
            className="group/cta inline-flex h-12 shrink-0 items-center gap-3 rounded-[var(--radius-pill)] bg-accent pl-6 pr-1.5 text-[15px] font-semibold text-accent-contrast shadow-[0_14px_30px_-14px_rgb(8_9_12/0.6)] transition-[background-color,translate,scale] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-accent-hover active:scale-[0.97]"
          >
            {dict.home.heroCta}
            <span className="flex size-9 items-center justify-center rounded-full bg-sky text-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/cta:rotate-45">
              <ArrowUpRightIcon size={18} weight="bold" aria-hidden />
            </span>
          </Link>
        </div>
      </div>

      {spotlight && (
        <Link
          href={localePath(locale, `/product/${spotlight.slug}`)}
          className="animate-enter material material-regular absolute bottom-4 left-1/2 z-[3] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-[var(--radius-pill)] py-1.5 pl-1.5 pr-4 text-left text-text transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift sm:bottom-6"
          style={{ "--i": 6 } as CSSProperties}
        >
          {spotlightImage && (
            <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-tint-pink">
              <Image
                src={spotlightImage.url}
                alt=""
                fill
                sizes="40px"
                className="object-cover mix-blend-multiply"
              />
            </span>
          )}
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
              {dict.home.heroSpotlight}
            </span>
            <span className="truncate text-[13px] font-semibold sm:text-sm">
              {spotlight.name[locale]}
              <span className="hidden sm:inline"> · {formatMoney(spotlight.priceUzs, locale)}</span>
            </span>
          </span>
          <ArrowUpRightIcon size={16} weight="bold" aria-hidden />
        </Link>
      )}
    </HeroStage>
  );
}
