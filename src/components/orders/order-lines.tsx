import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/money";
import type { OrderDetails } from "@/server/services/orders";

/** Состав заказа — снимок цен и названий на момент покупки, а не текущий каталог. */
export function OrderLines({ order, locale, dict }: { order: OrderDetails; locale: Locale; dict: Dictionary }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-border">
        {order.items.map((item) => (
          <li key={item.sku} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-[15px] font-medium">{item.name[locale]}</span>
              <span className="text-[13px] text-text-muted">
                {dict.product.sku}: {item.sku} · {item.quantity} × {formatMoney(item.unitPriceUzs, locale)}
              </span>
            </div>
            <span className="text-[15px] font-semibold tabular-nums">{formatMoney(item.lineTotalUzs, locale)}</span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 border-t border-border pt-4 text-[15px]">
        <dt className="text-text-muted">{dict.cart.subtotal}</dt>
        <dd className="text-right tabular-nums">{formatMoney(order.subtotalUzs, locale)}</dd>
        <dt className="text-text-muted">{dict.cart.delivery}</dt>
        <dd className="text-right tabular-nums">
          {order.deliveryFeeUzs ? formatMoney(order.deliveryFeeUzs, locale) : dict.cart.deliveryValue}
        </dd>
        <dt className="font-semibold">{dict.cart.total}</dt>
        <dd className="text-right font-display text-lg font-semibold tabular-nums">{formatMoney(order.totalUzs, locale)}</dd>
      </dl>
    </div>
  );
}
