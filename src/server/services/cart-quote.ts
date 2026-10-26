import type { CartItemInput, CartQuote, QuoteLine } from "@/features/cart/schema";
import { lineTotal } from "@/lib/money";
import { getProductsByIds } from "@/server/repositories/catalog";

// Цена и остаток всегда берутся из каталога; данные браузера используются только как список id и количеств.
export async function quoteCart(items: CartItemInput[]): Promise<CartQuote> {
  const requested = new Map<string, number>();
  for (const item of items) {
    requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
  }

  const products = await getProductsByIds([...requested.keys()]);
  const found = new Set(products.map((product) => product.id));

  const lines: QuoteLine[] = products.map((product) => {
    const requestedQuantity = requested.get(product.id) ?? 0;
    const quantity = Math.min(requestedQuantity, product.stockQuantity);
    const icon = product.category?.icon ?? "appliance";

    return {
      productId: product.id,
      slug: product.slug,
      sku: product.sku,
      brand: product.brand,
      name: product.name,
      categoryIcon: icon,
      imageUrl: (product.images.find((image) => image.isPrimary) ?? product.images[0])?.url ?? null,
      unitPriceUzs: product.priceUzs,
      compareAtPriceUzs: product.compareAtPriceUzs,
      requestedQuantity,
      quantity,
      availableQuantity: product.stockQuantity,
      lineTotalUzs: lineTotal(product.priceUzs, quantity),
      issue:
        product.stockQuantity === 0
          ? "out_of_stock"
          : quantity < requestedQuantity
            ? "quantity_reduced"
            : null,
    };
  });

  return {
    lines,
    missingProductIds: [...requested.keys()].filter((id) => !found.has(id)),
    subtotalUzs: lines.reduce((sum, line) => sum + line.lineTotalUzs, 0),
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}
