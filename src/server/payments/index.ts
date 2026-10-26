import type { CheckoutData, PaymentStatus } from "@/features/orders/schema";

// Адаптер платёжных провайдеров (Spec §2.5): ручная оплата при получении и Stripe Checkout.
// Провайдер определяет начальный статус платежа внутри транзакции заказа; сетевые вызовы
// к провайдеру (создание сессии Stripe) выполняются после коммита — см. services/orders.ts.

export interface PaymentProvider {
  id: "manual" | "stripe";
  initialStatus: PaymentStatus;
}

/** Наличными или картой курьеру/в пункте выдачи: оплату отмечает менеджер. */
export const manualProvider: PaymentProvider = { id: "manual", initialStatus: "not_started" };

/** Картой онлайн: статус меняет только подписанный webhook Stripe, не редирект браузера. */
export const stripeProvider: PaymentProvider = { id: "stripe", initialStatus: "pending" };

const providers: Record<CheckoutData["paymentMethod"], PaymentProvider> = {
  cash: manualProvider,
  card_on_delivery: manualProvider,
  card_online: stripeProvider,
};

export function providerFor(method: CheckoutData["paymentMethod"]): PaymentProvider {
  return providers[method];
}

/** Ручные переходы статуса оплаты, которые может выполнить менеджер. */
export const manualPaymentTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  not_started: ["paid", "failed"],
  pending: ["paid", "failed"],
  failed: ["paid"],
  paid: ["refunded"],
  refunded: [],
};

/** Переходы по событиям Stripe; повтор события с тем же статусом ничего не меняет. */
export const stripePaymentTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  not_started: [],
  pending: ["paid", "failed"],
  failed: [],
  paid: ["refunded"],
  refunded: [],
};
