import { z } from "zod";
import { locales } from "@/lib/i18n/config";

// Сообщения об ошибках — ключи словаря `admin.errors`.

export const categoryIcons = ["smartphone", "laptop", "tablet", "tv", "audio", "appliance"] as const;

function localized(max: number) {
  return z.object(
    Object.fromEntries(
      locales.map((locale) => [locale, z.string().trim().min(1, "required").max(max, "tooLong")]),
    ) as Record<(typeof locales)[number], z.ZodString>,
  );
}

const slug = z
  .string()
  .trim()
  .max(80, "tooLong")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slugInvalid");

const imageUrl = z
  .string()
  .trim()
  .max(500, "tooLong")
  .refine((value) => value === "" || /^(\/[\w./-]+|https:\/\/\S+)$/.test(value), "imageInvalid")
  .nullable()
  .transform((value) => value || null);

const money = z.coerce.number("numberInvalid").int("numberInvalid").positive("positive").max(2_000_000_000, "tooLarge");

export const productInputSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{3,40}$/, "skuInvalid")
      .transform((value) => value.toUpperCase()),
    slug,
    brand: z.string().trim().min(1, "required").max(60, "tooLong"),
    name: localized(120),
    description: localized(2000),
    priceUzs: money,
    compareAtPriceUzs: z
      .union([z.literal(""), z.null(), money])
      .transform((value) => (value === "" ? null : value)),
    stockQuantity: z.coerce.number("numberInvalid").int("numberInvalid").min(0, "notNegative").max(1_000_000, "tooLarge"),
    warrantyMonths: z.coerce.number("numberInvalid").int("numberInvalid").min(0, "notNegative").max(120, "tooLarge"),
    isActive: z.boolean(),
    categoryIds: z.array(z.string().min(1)).min(1, "categoryRequired"),
    imageUrl,
  })
  .superRefine((value, ctx) => {
    if (value.compareAtPriceUzs !== null && value.compareAtPriceUzs <= value.priceUzs) {
      ctx.addIssue({ code: "custom", path: ["compareAtPriceUzs"], message: "compareAtLow" });
    }
  });

export type ProductInput = z.output<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  slug,
  name: localized(80),
  description: localized(300),
  icon: z.enum(categoryIcons, "required"),
  sortOrder: z.coerce.number("numberInvalid").int("numberInvalid").min(0, "notNegative").max(999, "tooLarge"),
  isActive: z.boolean(),
  imageUrl,
});

export type CategoryInput = z.output<typeof categoryInputSchema>;

/** FormData → объект для схем: поля вида name.ru собираются во вложенный объект. */
export function formToObject(formData: FormData, { arrays = [] as string[], booleans = [] as string[] } = {}) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string" || key.startsWith("$")) continue;
    if (arrays.includes(key)) {
      result[key] = [...((result[key] as string[] | undefined) ?? []), value];
      continue;
    }
    const [head, tail] = key.split(".");
    if (tail) {
      result[head] = { ...((result[head] as Record<string, string> | undefined) ?? {}), [tail]: value };
    } else {
      result[key] = value;
    }
  }
  for (const key of arrays) result[key] ??= [];
  for (const key of booleans) result[key] = formData.get(key) === "on" || formData.get(key) === "true";
  return result;
}

export type FieldErrors = Record<string, string>;

export function issuesToFieldErrors(issues: z.core.$ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}
