import Link from "next/link";
import { brand } from "@/lib/brand";
import { localePath, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";

interface LogoProps {
  locale: Locale;
  label: string;
  size?: "md" | "lg";
}

export function Logo({ locale, label, size = "md" }: LogoProps) {
  const [first, second] = brand.wordmark;
  return (
    <Link
      href={localePath(locale)}
      aria-label={`${brand.name}, ${label}`}
      className={cn(
        "flex w-fit shrink-0 flex-col rounded-[var(--radius-field)] font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-text transition-opacity duration-300 hover:opacity-75",
        size === "lg" ? "text-[1.75rem]" : "text-[1.0625rem]",
      )}
    >
      <span aria-hidden>{first}</span>
      <span aria-hidden className="text-sky-deep">
        {second}
      </span>
    </Link>
  );
}
