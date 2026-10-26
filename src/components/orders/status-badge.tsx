import type { OrderStatus, PaymentStatus } from "@/features/orders/schema";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const orderTone: Record<OrderStatus, string> = {
  pending: "bg-accent-soft text-accent",
  confirmed: "bg-accent-soft text-accent",
  processing: "bg-warning-soft text-warning",
  shipped: "bg-warning-soft text-warning",
  completed: "bg-success-soft text-success",
  cancelled: "bg-surface-muted text-text-muted",
};

const paymentTone: Record<PaymentStatus, string> = {
  not_started: "bg-surface-muted text-text-muted",
  pending: "bg-warning-soft text-warning",
  paid: "bg-success-soft text-success",
  failed: "bg-danger-soft text-danger",
  refunded: "bg-surface-muted text-text-muted",
};

const base = "inline-flex h-7 items-center whitespace-nowrap rounded-[var(--radius-pill)] px-3 text-[13px] font-semibold";

export function OrderStatusBadge({ status, dict }: { status: OrderStatus; dict: Dictionary }) {
  return <span className={cn(base, orderTone[status])}>{dict.orderStatus[status]}</span>;
}

export function PaymentStatusBadge({ status, dict }: { status: PaymentStatus; dict: Dictionary }) {
  return <span className={cn(base, paymentTone[status])}>{dict.paymentStatus[status]}</span>;
}
