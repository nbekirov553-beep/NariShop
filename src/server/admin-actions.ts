"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  categoryInputSchema,
  formToObject,
  issuesToFieldErrors,
  productInputSchema,
  type FieldErrors,
} from "@/features/admin/schema";
import { orderStatuses, paymentStatuses } from "@/features/orders/schema";
import { defaultLocale, isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { getCurrentUser } from "@/server/policies";
import {
  createCategory,
  createProduct,
  setProductActive,
  updateCategory,
  updateProduct,
} from "@/server/services/catalog-admin";
import { changeOrderStatus, changePaymentStatus } from "@/server/services/orders";

// Каждое действие заново читает сессию: права проверяют сервисы, данные формы проходят Zod.

export interface FormState {
  status: "idle" | "saved" | "error";
  errors: FieldErrors;
}

function localeOf(formData: FormData): Locale {
  const value = formData.get("locale");
  return typeof value === "string" && isLocale(value) ? value : defaultLocale;
}

function idOf(formData: FormData): string | null {
  const value = formData.get("id");
  return typeof value === "string" && value ? value : null;
}

export async function saveProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = productInputSchema.safeParse(
    formToObject(formData, { arrays: ["categoryIds"], booleans: ["isActive"] }),
  );
  if (!parsed.success) return { status: "error", errors: issuesToFieldErrors(parsed.error.issues) };

  const user = await getCurrentUser();
  const id = idOf(formData);
  const result = id ? await updateProduct(user, id, parsed.data) : await createProduct(user, parsed.data);
  if (!result.ok) return { status: "error", errors: result.errors };
  if (!id) redirect(localePath(localeOf(formData), `/admin/products/${result.id}`));
  refresh();
  return { status: "saved", errors: {} };
}

export async function setProductActiveAction(formData: FormData): Promise<void> {
  const id = idOf(formData);
  if (!id) return;
  await setProductActive(await getCurrentUser(), id, formData.get("active") === "true");
  refresh();
}

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = categoryInputSchema.safeParse(formToObject(formData, { booleans: ["isActive"] }));
  if (!parsed.success) return { status: "error", errors: issuesToFieldErrors(parsed.error.issues) };

  const user = await getCurrentUser();
  const id = idOf(formData);
  const result = id ? await updateCategory(user, id, parsed.data) : await createCategory(user, parsed.data);
  if (!result.ok) return { status: "error", errors: result.errors };
  if (!id) redirect(localePath(localeOf(formData), `/admin/categories/${result.id}`));
  refresh();
  return { status: "saved", errors: {} };
}

const orderUpdateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("status"), number: z.string().min(1), value: z.enum(orderStatuses) }),
  z.object({ kind: z.literal("payment"), number: z.string().min(1), value: z.enum(paymentStatuses) }),
]);

export async function updateOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = orderUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", errors: { form: "generic" } };

  const user = await getCurrentUser();
  const data = parsed.data;
  const result =
    data.kind === "status"
      ? await changeOrderStatus(user, data.number, data.value)
      : await changePaymentStatus(user, data.number, data.value);
  if (!result.ok) return { status: "error", errors: { form: result.reason } };
  refresh();
  return { status: "saved", errors: {} };
}