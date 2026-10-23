import { t } from "@/lib/i18n/format";
import { cn } from "@/lib/cn";

const LOW_STOCK_THRESHOLD = 5;

interface StockStatusProps {
  quantity: number;
  labels: { inStock: string; lowStock: string; outOfStock: string };
  className?: string;
}

export function StockStatus({ quantity, labels, className }: StockStatusProps) {
  const state = quantity === 0 ? "out" : quantity <= LOW_STOCK_THRESHOLD ? "low" : "in";
  const text =
    state === "out"
      ? labels.outOfStock
      : state === "low"
        ? t(labels.lowStock, { count: quantity })
        : labels.inStock;

  return (
    <p
      className={cn(
        "text-[13px] font-medium",
        state === "out" && "text-text-muted",
        state === "low" && "text-warning",
        state === "in" && "text-success",
        className,
      )}
    >
      {text}
    </p>
  );
}
