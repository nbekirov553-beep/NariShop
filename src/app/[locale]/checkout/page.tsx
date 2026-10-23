import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/checkout-form";
import { getI18n } from "@/lib/i18n/dictionaries";

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
      <CheckoutForm />
    </div>
  );
}
