"use client";

import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

interface QuantityControlProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  labels: { decrease: string; increase: string; quantity: string };
  size?: "sm" | "md";
}

export function QuantityControl({ value, max, onChange, labels, size = "md" }: QuantityControlProps) {
  const button = cn(
    "flex items-center justify-center rounded-[var(--radius-pill)] text-text transition-colors",
    "hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-transparent",
    size === "sm" ? "size-8" : "size-10",
  );

  return (
    <div
      role="group"
      aria-label={labels.quantity}
      className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-border bg-surface p-0.5"
    >
      <button
        type="button"
        className={button}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={labels.decrease}
      >
        <MinusIcon size={16} weight="bold" aria-hidden />
      </button>
      <output aria-live="polite" className="min-w-8 text-center text-[15px] font-semibold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={labels.increase}
      >
        <PlusIcon size={16} weight="bold" aria-hidden />
      </button>
    </div>
  );
}
