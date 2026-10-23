"use client";

import { CheckIcon, ShoppingCartSimpleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { useCart, useHydrated } from "@/features/cart/store";
import { flyToCart } from "@/lib/fly-to-cart";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";
import { QuantityControl } from "./quantity-control";

interface AddToCartProps {
  productId: string;
  stock: number;
  productName: string;
}

export function AddToCartCompact({ productId, stock, productName }: AddToCartProps) {
  const { dict } = useI18n();
  const add = useCart((state) => state.add);
  const inCart = useCart((state) => state.items.some((item) => item.productId === productId));
  const hydrated = useHydrated();

  if (stock === 0) {
    return (
      <Button variant="secondary" size="sm" disabled full>
        {dict.product.outOfStock}
      </Button>
    );
  }

  const added = hydrated && inCart;
  return (
    <Button
      variant={added ? "secondary" : "primary"}
      size="sm"
      full
      onClick={(event) => {
        if (!added) flyToCart(event.currentTarget);
        add(productId, 1, stock);
      }}
      aria-label={`${dict.product.addToCart}: ${productName}`}
    >
      {added ? (
        <CheckIcon size={16} weight="bold" aria-hidden className="animate-pop" />
      ) : (
        <ShoppingCartSimpleIcon size={16} weight="bold" aria-hidden />
      )}
      {added ? dict.product.added : dict.product.addToCart}
    </Button>
  );
}

export function AddToCartPanel({ productId, stock }: Omit<AddToCartProps, "productName">) {
  const { dict, locale } = useI18n();
  const add = useCart((state) => state.add);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (stock === 0) {
    return (
      <Button variant="secondary" size="lg" disabled full>
        {dict.product.outOfStock}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuantityControl
          value={quantity}
          max={stock}
          onChange={(value) => {
            setQuantity(Math.max(1, Math.min(value, stock)));
            setJustAdded(false);
          }}
          labels={dict.product}
        />
        <Button
          size="lg"
          className="flex-1"
          onClick={(event) => {
            flyToCart(event.currentTarget);
            add(productId, quantity, stock);
            setJustAdded(true);
          }}
        >
          <ShoppingCartSimpleIcon size={20} weight="bold" aria-hidden />
          {dict.product.addToCart}
        </Button>
      </div>
      <div aria-live="polite" className="min-h-11">
        {justAdded && (
          <div className="animate-in-up flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-field)] bg-success-soft px-4 py-2">
            <span className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckIcon size={16} weight="bold" aria-hidden />
              {dict.product.added}
            </span>
            <Link
              href={localePath(locale, "/cart")}
              className={buttonStyles({ variant: "ghost", size: "sm" })}
            >
              {dict.product.goToCart}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
