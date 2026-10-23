import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface TagSpec {
  /** Индекс текста в dict.home.tags; null — декоративный смайлик из `glyph`. */
  text: number | null;
  glyph?: string;
  color: string;
  /** Позиция в процентах контейнера: базовая для телефона, md:/lg: для больших экранов. */
  position: string;
  /** На каких экранах тег виден: телефон показывает меньше тегов. */
  visibility?: string;
  rotate: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
}

const tags: TagSpec[] = [
  { text: 0, color: "bg-cloud", position: "lg:left-[10%] lg:top-[54%]", visibility: "hidden lg:block", rotate: -14, duration: 7.5, delay: -1, dx: 3, dy: -12 },
  { text: 1, color: "bg-pastel-butter", position: "left-[3%] top-[66%] md:left-[5%] md:top-[60%] lg:left-[6%] lg:top-[65%]", rotate: 12, duration: 6.2, delay: -3, dx: -4, dy: -10 },
  { text: null, glyph: "(◕‿◕)", color: "bg-pastel-lavender", position: "md:left-[24%] md:top-[56%] lg:left-[22%] lg:top-[63%]", visibility: "hidden md:block", rotate: -24, duration: 8.4, delay: -5, dx: 5, dy: -14 },
  { text: 2, color: "bg-pastel-pink", position: "left-[2%] top-[79%] md:left-[3%] md:top-[80%] lg:left-[4%] lg:top-[79%]", rotate: 16, duration: 7, delay: -2, dx: 4, dy: -9 },
  { text: 5, color: "bg-sky-cyan", position: "lg:left-[23%] lg:top-[79%]", visibility: "hidden lg:block", rotate: -10, duration: 9, delay: -4, dx: -3, dy: -12 },
  { text: 7, color: "bg-pastel-butter", position: "lg:left-[2.5%] lg:top-[92%]", visibility: "hidden lg:block", rotate: 0, duration: 6.8, delay: -6, dx: 4, dy: -8 },
  { text: 3, color: "bg-pastel-pink", position: "right-[3%] top-[69%] md:right-[6%] md:top-[58%] lg:right-[12%] lg:top-[53%]", rotate: 22, duration: 7.8, delay: -2.5, dx: -4, dy: -13 },
  { text: null, glyph: "(♡‿♡)", color: "bg-pastel-lavender", position: "lg:right-[4%] lg:top-[65%]", visibility: "hidden lg:block", rotate: -12, duration: 6.4, delay: -1.5, dx: 3, dy: -10 },
  { text: 4, color: "bg-pastel-peach", position: "right-[2%] top-[83%] md:right-[3%] md:top-[76%] lg:right-[5%] lg:top-[78%]", rotate: 14, duration: 8.2, delay: -3.5, dx: -5, dy: -11 },
  { text: 6, color: "bg-cloud", position: "lg:right-[13%] lg:top-[91%]", visibility: "hidden lg:block", rotate: -8, duration: 7.2, delay: -4.5, dx: 4, dy: -9 },
];

// Декоративные капсулы вокруг товара на главном экране. Скрыты от скринридеров и не ловят клики.
export function FloatingTags({ labels }: { labels: string[] }) {
  return (
    <ul aria-hidden className="pointer-events-none absolute inset-0 z-[2] select-none">
      {tags.map((tag, index) => (
        <li
          key={tag.glyph ?? tag.text}
          className={cn("parallax absolute", tag.position, tag.visibility)}
          style={{ "--depth": `${(index % 2 ? 1 : -1) * Math.round(tag.duration * 4)}px` } as CSSProperties}
        >
          <div className="animate-enter" style={{ "--i": index + 4 } as CSSProperties}>
            <div
              className="float-tag"
              style={
                {
                  "--dur": `${tag.duration}s`,
                  "--delay": `${tag.delay}s`,
                  "--dx": `${tag.dx}px`,
                  "--dy": `${tag.dy}px`,
                } as CSSProperties
              }
            >
              <span
                className={cn(
                  "tag-pill block whitespace-nowrap rounded-[var(--radius-pill)] px-[1.15em] py-[0.55em] text-[clamp(0.8125rem,1.3vw,1.3rem)] font-semibold leading-none tracking-[-0.01em] text-ink",
                  tag.color,
                )}
                style={{ "--r": `${tag.rotate}deg` } as CSSProperties}
              >
                {tag.text === null ? tag.glyph : labels[tag.text]}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
