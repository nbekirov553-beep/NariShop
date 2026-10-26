"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputStyles } from "@/components/ui/field";
import { orderTransitions, type OrderStatus, type PaymentStatus } from "@/features/orders/schema";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { updateOrderAction, type FormState } from "@/server/admin-actions";
import { FormStatus } from "./form-status";

const initial: FormState = { status: "idle", errors: {} };

function UpdateForm({
  number,
  kind,
  label,
  options,
  current,
  note,
}: {
  number: string;
  kind: "status" | "payment";
  label: string;
  options: Array<{ value: string; label: string }>;
  current?: string;
  note?: string;
}) {
  const { dict } = useI18n();
  const [state, action, pending] = useActionState(updateOrderAction, initial);
  const id = `order-${kind}`;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="number" value={number} />
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <select id={id} name="value" defaultValue={current} className={cn(inputStyles, "h-11 min-w-0 flex-1")}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" disabled={pending}>
          {dict.admin.orders.apply}
        </Button>
      </div>
      {note && <p className="text-[13px] text-text-muted">{note}</p>}
      <FormStatus state={state} pending={pending} />
    </form>
  );
}

export function OrderActions({
  number,
  status,
  paymentStatus,
  paymentTargets,
}: {
  number: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentTargets: PaymentStatus[];
}) {
  const { dict } = useI18n();
  const next = orderTransitions[status];
  return (
    <div className="flex flex-col gap-5">
      {next.length > 0 ? (
        <UpdateForm
          key={`status-${status}`}
          number={number}
          kind="status"
          label={dict.admin.orders.changeStatus}
          options={next.map((value) => ({ value, label: dict.orderStatus[value] }))}
          note={next.includes("cancelled") ? dict.admin.orders.cancelNote : undefined}
        />
      ) : (
        <p className="text-sm text-text-muted">{dict.admin.orders.finalStatus}</p>
      )}
      {paymentTargets.length > 0 && (
        <UpdateForm
          key={`payment-${paymentStatus}`}
          number={number}
          kind="payment"
          label={dict.admin.orders.changePayment}
          options={paymentTargets.map((value) => ({ value, label: dict.paymentStatus[value] }))}
        />
      )}
    </div>
  );
}
