"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAX_QUANTITY_PER_ITEM, type CartItemInput } from "./schema";

interface CartState {
  items: CartItemInput[];
  add: (productId: string, quantity: number, max: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  replace: (items: CartItemInput[]) => void;
  clear: () => void;
}

const clamp = (value: number, max: number) =>
  Math.max(1, Math.min(value, max, MAX_QUANTITY_PER_ITEM));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (productId, quantity, max) =>
        set((state) => {
          const existing = state.items.find((item) => item.productId === productId);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: clamp(item.quantity + quantity, max) }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { productId, quantity: clamp(quantity, max) }] };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: clamp(quantity, MAX_QUANTITY_PER_ITEM) }
              : item,
          ),
        })),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),
      replace: (items) => set({ items }),
      clear: () => set({ items: [] }),
    }),
    { name: "narishop-cart", version: 1 },
  ),
);

export function useCartCount(): number {
  return useCart((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
}

const noopSubscribe = () => () => {};

// Корзина живёт в localStorage, поэтому до гидрации сервер и клиент рендерят одинаковое пустое состояние.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
