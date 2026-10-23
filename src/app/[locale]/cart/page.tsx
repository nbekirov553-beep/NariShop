import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getI18n } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.cart.title, robots: { index: false } };
}

export default async function CartPage() {
  const { dict } = await getI18n();
  return (
    <div className="sheet flex flex-col gap-6">
      <h1 className="font-display text-[1.75rem] font-semibold tracking-tight sm:text-4xl">{dict.cart.title}</h1>
      <CartView />
    </div>
  );
}
