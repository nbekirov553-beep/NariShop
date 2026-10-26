import type Stripe from "stripe";
import { orderNumberForPaymentIntent, verifyWebhook, WebhookSignatureError } from "@/server/payments/stripe";
import { applyStripePayment } from "@/server/services/orders";

// Webhook Stripe: единственный источник правды об оплате (редирект браузера ничего не доказывает).
// Подпись проверяется по сырому телу; ошибки БД → 500, чтобы Stripe повторил доставку.

type Outcome = { orderNumber: string | null; to: "paid" | "failed" | "refunded" } | null;

function sessionOrder(session: Stripe.Checkout.Session): string | null {
  return session.metadata?.orderNumber ?? session.client_reference_id ?? null;
}

async function outcomeOf(event: Stripe.Event): Promise<Outcome> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // unpaid — отложенный способ оплаты: ждём async_payment_succeeded / failed.
      if (session.payment_status === "unpaid") return null;
      return { orderNumber: sessionOrder(session), to: "paid" };
    }
    case "checkout.session.async_payment_succeeded":
      return { orderNumber: sessionOrder(event.data.object), to: "paid" };
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      return { orderNumber: sessionOrder(event.data.object), to: "failed" };
    case "charge.refunded": {
      const charge = event.data.object;
      // Частичный возврат статус не меняет — менеджер видит его в Dashboard Stripe.
      if (!charge.refunded) return null;
      const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      const orderNumber = charge.metadata?.orderNumber ?? (paymentIntent ? await orderNumberForPaymentIntent(paymentIntent) : null);
      return { orderNumber, to: "refunded" };
    }
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = verifyWebhook(payload, request.headers.get("stripe-signature"));
  } catch (error) {
    if (error instanceof WebhookSignatureError) {
      return Response.json({ error: { code: "invalid_signature" } }, { status: 400 });
    }
    console.error("[stripe] webhook is not configured", error);
    return Response.json({ error: { code: "not_configured" } }, { status: 500 });
  }

  const outcome = await outcomeOf(event);
  if (!outcome) return Response.json({ received: true, ignored: event.type });
  if (!outcome.orderNumber) {
    console.warn("[stripe] event without order number", event.id, event.type);
    return Response.json({ received: true, ignored: "no_order" });
  }

  const result = await applyStripePayment(outcome.orderNumber, outcome.to, event.id);
  if (result.reason) console.warn("[stripe] event not applied", event.id, outcome.orderNumber, result.reason);
  return Response.json({ received: true, changed: result.changed });
}
