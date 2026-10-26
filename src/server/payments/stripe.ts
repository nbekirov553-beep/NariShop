import Stripe from "stripe";
import type { Locale } from "@/lib/i18n/config";
import { formatUsd, formatUsdRate, uzsToUsd } from "@/lib/money";

// Онлайн-оплата картой через Stripe Checkout. Ключи только на сервере (`STRIPE_*` в env).
// UZS в Stripe — двухдесятичная валюта: сумма передаётся в тийинах (× 100).

/** Сколько ждём оплату: после истечения сессии заказ отменяется и товар возвращается на склад. */
export const CHECKOUT_TTL_SECONDS = 60 * 60;

let client: Stripe | null = null;

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 15_000 });
  return client;
}

export function uzsToMinor(amountUzs: number): number {
  return amountUzs * 100;
}

const stripeLocale: Record<Locale, Stripe.Checkout.SessionCreateParams.Locale> = {
  ru: "ru",
  en: "en",
  // Узбекского в Stripe Checkout нет — показываем русский.
  uz: "ru",
};

export interface CheckoutSessionRequest {
  /** UUID заказа из формы: уникален во всех окружениях, которые делят один аккаунт Stripe. */
  idempotencyKey: string;
  orderNumber: string;
  amountUzs: number;
  locale: Locale;
  baseUrl: string;
  email?: string;
  /** Курс USD → UZS: только подпись «≈ $X» на странице оплаты, списание остаётся в сумах. */
  usdRate?: number | null;
}

export async function createCheckoutSession(request: CheckoutSessionRequest): Promise<{ id: string; url: string }> {
  const { idempotencyKey, orderNumber, amountUzs, locale, baseUrl, email, usdRate } = request;
  const usdHint = usdRate
    ? `≈ ${formatUsd(uzsToUsd(amountUzs, usdRate), "en")} (${formatUsdRate(usdRate, "en")})`
    : undefined;
  const resultUrl = (outcome: "success" | "cancelled") =>
    `${baseUrl}/${locale}/checkout/result?order=${encodeURIComponent(orderNumber)}&payment=${outcome}`;
  const session = await getStripe().checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "uzs",
            unit_amount: uzsToMinor(amountUzs),
            product_data: { name: `NariShop — ${orderNumber}`, description: usdHint },
          },
        },
      ],
      client_reference_id: orderNumber,
      metadata: usdRate ? { orderNumber, usdUzsRate: String(usdRate) } : { orderNumber },
      payment_intent_data: { metadata: { orderNumber } },
      customer_email: email,
      locale: stripeLocale[locale],
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_TTL_SECONDS,
      success_url: resultUrl("success"),
      cancel_url: resultUrl("cancelled"),
    },
    // Повторный вызов для того же заказа вернёт ту же сессию, а не создаст вторую.
    { idempotencyKey: `checkout:${idempotencyKey}` },
  );
  if (!session.url) throw new Error("Stripe returned a session without url");
  return { id: session.id, url: session.url };
}

export class WebhookSignatureError extends Error {}

/** Проверяет подпись `Stripe-Signature` по сырому телу запроса; без секрета webhook не принимается. */
export function verifyWebhook(payload: string, signature: string | null): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  if (!signature) throw new WebhookSignatureError("Missing Stripe-Signature");
  try {
    return Stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    throw new WebhookSignatureError(error instanceof Error ? error.message : "Invalid signature");
  }
}

/** Номер заказа по платежу: для возврата приходит charge, заказ ищем через его Checkout Session. */
export async function orderNumberForPaymentIntent(paymentIntentId: string): Promise<string | null> {
  const { data } = await getStripe().checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
  return data[0]?.metadata?.orderNumber ?? null;
}
