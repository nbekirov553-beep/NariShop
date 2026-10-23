import { z } from "zod";

export const sortOptions = ["popular", "price-asc", "price-desc", "new"] as const;
export type SortOption = (typeof sortOptions)[number];

export const PAGE_SIZE = 12;

const intFromString = z.coerce.number().int().min(0).max(1_000_000_000);

export const catalogQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(60)
    .optional(),
  brand: z
    .string()
    .max(200)
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .optional(),
  minPrice: intFromString.optional(),
  maxPrice: intFromString.optional(),
  inStock: z.enum(["1"]).transform(() => true).optional(),
  sort: z.enum(sortOptions).default("popular"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(PAGE_SIZE),
});

export type CatalogQuery = z.output<typeof catalogQuerySchema>;

type RawParams = Record<string, string | string[] | undefined>;

function firstValues(raw: RawParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined && first !== "") result[key] = first;
  }
  return result;
}

export function parseCatalogQueryStrict(raw: RawParams) {
  return catalogQuerySchema.safeParse(firstValues(raw));
}

// Для страниц: некорректные параметры отбрасываются, страница не ломается.
export function parseCatalogQueryLenient(raw: RawParams): CatalogQuery {
  const values = firstValues(raw);
  const shape = catalogQuerySchema.shape;
  const cleaned: Record<string, string> = {};
  for (const key of Object.keys(shape) as Array<keyof typeof shape>) {
    const value = values[key];
    if (value !== undefined && shape[key].safeParse(value).success) {
      cleaned[key] = value;
    }
  }
  return catalogQuerySchema.parse(cleaned);
}
