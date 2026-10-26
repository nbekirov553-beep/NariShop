import Link from "next/link";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badge";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatDateTime } from "@/lib/i18n/format";
import { formatMoney } from "@/lib/money";
import type { OrderSummary } from "@/server/services/orders";
import { tableStyles as s } from "./ui";

export function OrdersTable({ orders, locale, dict }: { orders: OrderSummary[]; locale: Locale; dict: Dictionary }) {
  const o = dict.admin.orders;
  return (
    <div className={s.wrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col" className={s.th}>{o.number}</th>
            <th scope="col" className={s.th}>{o.date}</th>
            <th scope="col" className={s.th}>{o.customer}</th>
            <th scope="col" className={s.th}>{o.status}</th>
            <th scope="col" className={s.th}>{o.payment}</th>
            <th scope="col" className={`${s.th} text-right`}>{o.total}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.orderNumber} className="last:[&>td]:border-b-0">
              <td className={s.td}>
                <Link href={localePath(locale, `/admin/orders/${order.orderNumber}`)} className={s.link}>
                  {order.orderNumber}
                </Link>
              </td>
              <td className={`${s.td} whitespace-nowrap text-text-muted`}>{formatDateTime(order.createdAt, locale)}</td>
              <td className={s.td}>{order.customerName}</td>
              <td className={s.td}>
                <OrderStatusBadge status={order.status} dict={dict} />
              </td>
              <td className={s.td}>
                <PaymentStatusBadge status={order.paymentStatus} dict={dict} />
              </td>
              <td className={`${s.td} whitespace-nowrap text-right font-semibold tabular-nums`}>
                {formatMoney(order.totalUzs, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
