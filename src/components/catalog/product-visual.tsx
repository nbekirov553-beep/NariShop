import Image from "next/image";
import { ViewTransition } from "react";
import { cn } from "@/lib/cn";
import { CategoryIcon } from "./category-icon";

interface ProductVisualProps {
  icon: string;
  image?: { url: string; alt: string } | null;
  placeholderLabel: string;
  sizes?: string;
  eager?: boolean;
  iconSize?: number;
  /** Пастельный фон (класс bg-tint-*): студийное фото ложится на него через multiply. */
  tone?: string;
  className?: string;
  /** Имя для морфинга фото между карточкой и страницей товара; на странице должно быть уникальным. */
  transitionName?: string;
}

export function ProductVisual({
  icon,
  image,
  placeholderLabel,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  eager = false,
  iconSize = 72,
  tone,
  className,
  transitionName,
}: ProductVisualProps) {
  const content = image ? (
    <Image
      src={image.url}
      alt={image.alt}
      fill
      sizes={sizes}
      loading={eager ? "eager" : undefined}
      fetchPriority={eager ? "high" : undefined}
      className={cn(
        "object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:scale-[1.06]",
        tone && "mix-blend-multiply",
      )}
    />
  ) : (
    <>
      <CategoryIcon icon={icon} size={iconSize} weight="duotone" className="text-ink/45" />
      <span className="sr-only">{placeholderLabel}</span>
    </>
  );

  const visual = (
    <div
      className={cn(
        "relative isolate flex aspect-square items-center justify-center overflow-hidden",
        tone ?? "bg-photo",
        className,
      )}
    >
      {content}
    </div>
  );

  if (!transitionName) return visual;
  return (
    <ViewTransition name={transitionName} share="morph" default="none">
      {visual}
    </ViewTransition>
  );
}
