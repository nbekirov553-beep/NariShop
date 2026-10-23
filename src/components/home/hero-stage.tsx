"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface HeroStageProps {
  children: ReactNode;
  className?: string;
  labelledBy: string;
}

// Секция главного экрана: передаёт положение курсора в CSS-переменные --px/--py (от -1 до 1),
// на них опираются слои .parallax. Только для мыши и без prefers-reduced-motion.
export function HeroStage({ children, className, labelledBy }: HeroStageProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!node || !query.matches) return;

    let frame = 0;
    const setPointer = (x: number, y: number) => {
      node.style.setProperty("--px", x.toFixed(3));
      node.style.setProperty("--py", y.toFixed(3));
    };

    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        setPointer(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          ((event.clientY - rect.top) / rect.height) * 2 - 1,
        );
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(frame);
      setPointer(0, 0);
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section ref={ref} aria-labelledby={labelledBy} className={className}>
      {children}
    </section>
  );
}
