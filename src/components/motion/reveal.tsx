import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface RevealProps {
  children: ReactNode;
  as?: "div" | "li" | "section";
  /** Порядковый номер в ряду: небольшой сдвиг, чтобы карточки появлялись волной. */
  index?: number;
  className?: string;
}

// Появление при прокрутке на CSS (animation-timeline: view(), см. .reveal в globals.css):
// не требует JS, поэтому серверный HTML виден сразу, даже до гидрации.
export function Reveal({ children, as: Tag = "div", index = 0, className }: RevealProps) {
  return (
    <Tag className={cn("reveal", className)} style={{ "--i": index % 4 } as CSSProperties}>
      {children}
    </Tag>
  );
}
