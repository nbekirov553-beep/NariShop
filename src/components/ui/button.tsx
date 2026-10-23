import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-contrast hover:bg-accent-hover disabled:bg-surface-muted disabled:text-text-muted",
  secondary:
    "bg-surface text-text border border-border hover:border-text-muted disabled:text-text-muted",
  ghost: "text-text hover:bg-surface-muted disabled:text-text-muted",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-7 text-base gap-2",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  full = false,
  className,
}: { variant?: Variant; size?: Size; full?: boolean; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] font-semibold",
    "transition-[background-color,border-color,color,scale] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
    "disabled:cursor-not-allowed disabled:active:scale-100",
    variants[variant],
    sizes[size],
    full && "w-full",
    className,
  );
}

export function Button({
  variant,
  size,
  full,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <button type={type} className={buttonStyles({ variant, size, full, className })} {...props} />;
}
