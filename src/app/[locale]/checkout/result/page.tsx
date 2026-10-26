import { CheckCircleIcon, ClockIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonStyles } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getI18n, type Dictionary } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/format";
import { getCurrentUser } from "@/server/policies";
import { getPaymentStateForUser } from "@/server/services/orders";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.payment.title, robots: { index: false } };
}

export default async function PaymentResultPage({ searchParams }: PageProps<"/[locale]/checkout/result">) {
  const { locale, dict } = await getI18n();
  return (
    <div className="sheet flex flex-col gap-6">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />}>
        <PaymentResult locale={locale} dict={dict} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

type Tone = "success" | "pending" | "danger";

const tones: Record<Tone, { icon: typeof CheckCircleIcon; className: string }> = {
  success: { icon: CheckCircleIcon, className: "text-success" },
  pending: { icon: ClockIcon, className: "text-warning" },
  danger: { icon: WarningCircleIcon, className: "text-danger" },
};

async function PaymentResult({
  locale,
  dict,
  searchParams,
}: {
  locale: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[locale]/checkout/result">["searchParams"];
}) {
  const query = await searchParams;
  const orderNumber = typeof query.order === "string" && /^NS-\d+$/.test(query.order) ? query.order : null;
  const returned = query.payment === "cancelled" ? "cancelled" : "success";
  const user = await getCurrentUser();
  // Редирект со Stripe ничего не доказывает: реальный статус берём из БД (только для владельца заказа).
  const state = orderNumber && user ? await getPaymentStateForUser(orderNumber, user.id) : null;
  const p = dict.payment;

  let tone: Tone;
  let title: string;
  let text: string;
  if (state?.paymentStatus === "paid") {
    [tone, title, text] = ["success", p.paidTitle, p.paidText];
  } else if (state?.paymentStatus === "failed" || state?.paymentStatus === "refunded") {
    [tone, title, text] = ["danger", p.failedTitle, p.failedText];
  } else if (returned === "cancelled") {
    [tone, title, text] = ["pending", p.cancelledTitle, p.cancelledText];
  } else {
    [tone, title, text] = ["pending", p.processingTitle, p.processingText];
  }
  const { icon: Icon, className } = tones[tone];

  return (
    <div role="status" className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-8 sm:p-12">
      <Icon size={48} weight="duotone" aria-hidden className={className} />
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
      {orderNumber && <p className="text-[15px] font-semibold">{t(p.order, { number: orderNumber })}</p>}
      <p className="max-w-[55ch] text-[15px] text-text-muted">{text}</p>
      <div className="flex flex-wrap gap-3">
        {state?.paymentUrl && (
          <a href={state.paymentUrl} className={buttonStyles()}>
            {p.retry}
          </a>
        )}
        {state && orderNumber ? (
          <Link
            href={localePath(locale, `/account/orders/${orderNumber}`)}
            className={buttonStyles({ variant: state.paymentUrl ? "secondary" : "primary" })}
          >
            {p.toOrder}
          </Link>
        ) : null}
        <Link href={localePath(locale, "/catalog")} className={buttonStyles({ variant: state ? "ghost" : "primary" })}>
          {dict.checkout.toCatalog}
        </Link>
      </div>
    </div>
  );
}
