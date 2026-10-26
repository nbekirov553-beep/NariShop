import type { Metadata } from "next";
import { Suspense } from "react";
import { CartSkeleton } from "@/components/cart/cart-states";
import { CheckoutForm, type CheckoutDefaults } from "@/components/cart/checkout-form";
import { fullName } from "@/features/profile/schema";
import { getI18n } from "@/lib/i18n/dictionaries";
import { getUsdRate } from "@/server/fx";
import { isStripeEnabled } from "@/server/payments/stripe";
import { getCurrentUser } from "@/server/policies";
import { getOwnProfile } from "@/server/services/users";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.checkout.title, robots: { index: false } };
}

export default async function CheckoutPage() {
  const { dict } = await getI18n();
  return (
    <div className="sheet flex flex-col gap-6">
      <h1 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl">
        {dict.checkout.title}
      </h1>
      <Suspense fallback={<CartSkeleton />}>
        <CheckoutWithProfile />
      </Suspense>
    </div>
  );
}

/** Вошедшему покупателю подставляем контакты и адрес из профиля. */
async function CheckoutWithProfile() {
  const user = await getCurrentUser();
  const profile = user ? await getOwnProfile(user.id) : null;
  const defaults: CheckoutDefaults | undefined = profile
    ? {
        name: fullName(profile),
        phone: profile.phone,
        email: profile.email,
        city: profile.city,
        address: profile.address,
      }
    : undefined;
  return <CheckoutForm defaults={defaults} onlinePayment={isStripeEnabled()} usdRate={getUsdRate()} />;
}
