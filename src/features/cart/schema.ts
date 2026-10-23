import { z } from "zod";

export const MAX_QUANTITY_PER_ITEM = 99;

export const cartItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(40),
      quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
    }),
  )
  .max(50);

export type CartItemInput = z.infer<typeof cartItemsSchema>[number];

export type QuoteIssue = "out_of_stock" | "quantity_reduced";

export interface QuoteLine {
  productId: string;
  slug: string;
  sku: string;
  brand: string;
  name: Record<"uz" | "ru" | "en", string>;
  categoryIcon: string;
  imageUrl: string | null;
  unitPriceUzs: number;
  compareAtPriceUzs: number | null;
  requestedQuantity: number;
  quantity: number;
  availableQuantity: number;
  lineTotalUzs: number;
  issue: QuoteIssue | null;
}

export interface CartQuote {
  lines: QuoteLine[];
  missingProductIds: string[];
  subtotalUzs: number;
  itemCount: number;
}
