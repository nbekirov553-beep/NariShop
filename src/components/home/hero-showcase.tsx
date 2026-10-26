"use client";

import { ArrowUpRightIcon, CaretLeftIcon, CaretRightIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type TouchEvent } from "react";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/format";

export interface ShowcaseSlide {
  href: string;
  name: string;
  price: string;
  imageUrl: string | null;
}

interface HeroShowcaseProps {
  slides: ShowcaseSlide[];
  /** Фото-сцена для первого слайда (товар снят на hero-фото). Без неё все слайды — фото товаров. */
  scene: ReactNode | null;
  labels: {
    spotlight: string;
    carousel: string;
    prev: string;
    next: string;
    goTo: string;
    pause: string;
    play: string;
    counter: string;
  };
  /** Заголовок, теги и прочее содержимое hero — между фото и управлением. */
  children: ReactNode;
}

const SWIPE_MIN = 48;

// Листает товары «в кадре». Автосмена идёт по окончании анимации полоски прогресса,
// поэтому пауза (наведение, фокус, кнопка) останавливает и полоску, и смену одновременно.
export function HeroShowcase({ slides, scene, labels, children }: HeroShowcaseProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  // До проверки media query автосмена выключена: иначе при reduced motion анимация длиной 0.01ms сразу перелистнёт слайд.
  const [reducedMotion, setReducedMotion] = useState(true);
  const [announce, setAnnounce] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const count = slides.length;
  const current = slides[index];
  const autoplay = count > 1 && !paused && !reducedMotion;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  function go(step: number, manual = true) {
    setAnnounce(manual);
    setIndex((value) => (value + step + count) % count);
  }

  function show(target: number) {
    setAnnounce(true);
    setIndex(target);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") go(-1);
    else if (event.key === "ArrowRight") go(1);
    else return;
    event.preventDefault();
  }

  function onTouchStart(event: TouchEvent) {
    const point = event.touches[0];
    touch.current = point ? { x: point.clientX, y: point.clientY } : null;
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touch.current;
    const point = event.changedTouches[0];
    touch.current = null;
    if (!start || !point || count < 2) return;
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  }

  const roundButton =
    "material material-regular flex size-10 shrink-0 items-center sm:size-11 justify-center rounded-full text-text transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift active:scale-95";

  return (
    <div className="contents" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div aria-hidden className="hero-photo parallax z-0" style={{ "--depth": "-14px" } as CSSProperties}>
        <div className="hero-levitate" data-kind={scene && index === 0 ? "scene" : "product"}>
          {count === 0 && <div className="hero-slide is-active">{scene}</div>}
          {slides.map((slide, slideIndex) => (
            <div key={slide.href} className={cn("hero-slide", slideIndex === index && "is-active")}>
              {scene && slideIndex === 0 ? (
                scene
              ) : (
                slide.imageUrl && (
                  <div className="hero-product">
                    <Image src={slide.imageUrl} alt="" fill sizes="(min-width: 1024px) 50vw, 90vw" className="object-cover" />
                  </div>
                )
              )}
            </div>
          ))}
          {[0, 1, 2].map((ring) => (
            <span key={ring} className="hero-ring" style={{ "--i": ring } as CSSProperties} />
          ))}
        </div>
      </div>

      {children}

      {current && (
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label={labels.carousel}
          onKeyDown={onKeyDown}
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
          }}
          className="animate-enter absolute bottom-3 left-1/2 z-[3] flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 flex-col items-center gap-1.5 sm:bottom-5"
          style={{ "--i": 6 } as CSSProperties}
        >
          {count > 1 && (
            <div className="flex items-center gap-0.5">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.href}
                  type="button"
                  onClick={() => show(slideIndex)}
                  aria-label={t(labels.goTo, { name: slide.name })}
                  aria-current={slideIndex === index ? "true" : undefined}
                  className="group/dot flex h-6 items-center px-1"
                >
                  <span
                      className={cn(
                        "relative h-1 overflow-hidden rounded-full bg-hero-ink/25 transition-[width] duration-500 group-hover/dot:bg-hero-ink/40",
                        slideIndex === index ? "w-9 sm:w-12" : "w-4 sm:w-6",
                      )}
                    >
                    {slideIndex === index && (
                      <span
                        key={index}
                        className={cn("hero-progress absolute inset-0 rounded-full bg-hero-ink", autoplay && "is-running")}
                        style={{ animationPlayState: autoplay && !held ? "running" : "paused" }}
                        onAnimationEnd={(event) => {
                          if (event.animationName === "hero-progress") go(1, false);
                        }}
                      />
                    )}
                  </span>
                </button>
              ))}
              {!reducedMotion && (
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  aria-label={paused ? labels.play : labels.pause}
                  aria-pressed={paused}
                  className="ml-1 flex size-6 items-center justify-center rounded-full text-hero-ink/80 transition-colors hover:bg-hero-ink/10 hover:text-hero-ink"
                >
                  {paused ? <PlayIcon size={12} weight="fill" aria-hidden /> : <PauseIcon size={12} weight="fill" aria-hidden />}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2">
            {count > 1 && (
              <button type="button" onClick={() => go(-1)} aria-label={labels.prev} className={roundButton}>
                <CaretLeftIcon size={18} weight="bold" aria-hidden />
              </button>
            )}
            <Link
              href={current.href}
              className="material material-regular flex w-[min(23rem,calc(100vw-8.5rem))] items-center gap-3 rounded-[var(--radius-pill)] py-1.5 pl-1.5 pr-4 text-left text-text transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-tint-pink">
                {current.imageUrl && (
                  <Image key={current.href} src={current.imageUrl} alt="" fill sizes="40px" className="animate-theme-swap object-cover mix-blend-multiply" />
                )}
              </span>
              <span key={current.href} className="animate-theme-swap flex min-w-0 flex-1 flex-col leading-tight">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
                  {labels.spotlight}
                  {count > 1 && <span className="hidden normal-case tracking-normal sm:inline"> · {t(labels.counter, { current: index + 1, count })}</span>}
                </span>
                <span className="truncate text-[13px] font-semibold sm:text-sm">
                  {current.name}
                  <span className="hidden sm:inline"> · {current.price}</span>
                </span>
              </span>
              <ArrowUpRightIcon size={16} weight="bold" aria-hidden className="shrink-0" />
            </Link>
            {count > 1 && (
              <button type="button" onClick={() => go(1)} aria-label={labels.next} className={roundButton}>
                <CaretRightIcon size={18} weight="bold" aria-hidden />
              </button>
            )}
          </div>

          <p className="sr-only" aria-live={announce ? "polite" : "off"} aria-atomic>
            {current.name}, {current.price}
          </p>
        </div>
      )}
    </div>
  );
}
