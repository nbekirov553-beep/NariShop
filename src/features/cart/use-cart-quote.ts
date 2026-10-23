"use client";

import { useEffect, useState } from "react";
import type { CartItemInput, CartQuote } from "./schema";
import { useCart, useHydrated } from "./store";

interface QuoteState {
  key: string | null;
  quote: CartQuote | null;
  error: boolean;
  removedMissing: boolean;
}

export type QuoteStatus = "loading" | "ready" | "error" | "empty";

export function useCartQuote() {
  const hydrated = useHydrated();
  const items = useCart((state) => state.items);
  const key = JSON.stringify(items);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<QuoteState>({
    key: null,
    quote: null,
    error: false,
    removedMissing: false,
  });

  useEffect(() => {
    const requested = JSON.parse(key) as CartItemInput[];
    if (!hydrated || requested.length === 0) return;
    const controller = new AbortController();

    fetch("/api/v1/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: requested }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Quote failed: ${response.status}`);
        return response.json() as Promise<{ data: CartQuote }>;
      })
      .then(({ data }) => {
        setState((prev) => ({
          key,
          quote: data,
          error: false,
          removedMissing: prev.removedMissing || data.missingProductIds.length > 0,
        }));

        // Приводим корзину к фактическим остаткам: снятые товары убираем, количество уменьшаем.
        const reduced = new Map(
          data.lines
            .filter((line) => line.issue === "quantity_reduced")
            .map((line) => [line.productId, line.availableQuantity]),
        );
        if (data.missingProductIds.length > 0 || reduced.size > 0) {
          const missing = new Set(data.missingProductIds);
          useCart.getState().replace(
            requested
              .filter((item) => !missing.has(item.productId))
              .map((item) => ({
                ...item,
                quantity: reduced.get(item.productId) ?? item.quantity,
              })),
          );
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setState((prev) => ({ ...prev, key, error: true }));
      });

    return () => controller.abort();
  }, [hydrated, key, attempt]);

  let status: QuoteStatus;
  if (!hydrated) status = "loading";
  else if (items.length === 0) status = "empty";
  else if (state.key === key && state.error) status = "error";
  else if (state.key === key && state.quote) status = "ready";
  else status = "loading";

  const orderedLines = state.quote
    ? items
        .map((item) => state.quote!.lines.find((line) => line.productId === item.productId))
        .filter((line) => line !== undefined)
    : [];

  return {
    status,
    quote: state.quote,
    lines: orderedLines,
    items,
    removedMissing: state.removedMissing,
    retry: () => setAttempt((value) => value + 1),
  };
}
