"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import type { ProductInput } from "@/features/admin/schema";
import { useI18n } from "@/lib/i18n/client";
import { localeNames, locales, type Localized } from "@/lib/i18n/config";
import { saveProductAction, type FormState } from "@/server/admin-actions";
import { FormStatus, useAdminError } from "./form-status";
import { keepValuesOnSubmit } from "./use-keep-values";

const initial: FormState = { status: "idle", errors: {} };

const fieldset = "flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6";
const legend = "float-left mb-1 w-full font-display text-lg font-semibold";

export function ProductForm({
  product,
  categories,
}: {
  product: (ProductInput & { id: string }) | null;
  categories: Array<{ id: string; name: Localized }>;
}) {
  const { dict, locale } = useI18n();
  const [state, action, pending] = useActionState(saveProductAction, initial);
  const errorText = useAdminError();
  const f = dict.admin.fields;
  const err = (key: string) => errorText(state.errors[key]);

  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      {product && <input type="hidden" name="id" value={product.id} />}

      <fieldset className={fieldset}>
        <legend className={legend}>{dict.admin.products.product}</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField id="sku" name="sku" label={f.sku} hint={f.skuHint} defaultValue={product?.sku} error={err("sku")} required />
          <TextField id="slug" name="slug" label={f.slug} hint={f.slugHint} defaultValue={product?.slug} error={err("slug")} required />
          <TextField id="brand" name="brand" label={f.brand} defaultValue={product?.brand} error={err("brand")} required />
        </div>
      </fieldset>

      {locales.map((lang) => (
        <fieldset key={lang} className={fieldset} lang={lang}>
          <legend className={legend}>{localeNames[lang]}</legend>
          <TextField
            id={`name-${lang}`}
            name={`name.${lang}`}
            label={f.name}
            defaultValue={product?.name[lang]}
            error={err(`name.${lang}`)}
            required
          />
          <TextAreaField
            id={`description-${lang}`}
            name={`description.${lang}`}
            label={f.description}
            defaultValue={product?.description[lang]}
            error={err(`description.${lang}`)}
            rows={4}
            required
          />
        </fieldset>
      ))}

      <fieldset className={fieldset}>
        <legend className={legend}>{dict.admin.products.price}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="priceUzs" name="priceUzs" label={f.priceUzs} inputMode="numeric" defaultValue={product?.priceUzs} error={err("priceUzs")} required />
          <TextField
            id="compareAtPriceUzs"
            name="compareAtPriceUzs"
            label={f.compareAtPriceUzs}
            hint={f.compareAtHint}
            inputMode="numeric"
            defaultValue={product?.compareAtPriceUzs ?? ""}
            error={err("compareAtPriceUzs")}
          />
          <TextField id="stockQuantity" name="stockQuantity" label={f.stockQuantity} inputMode="numeric" defaultValue={product?.stockQuantity ?? 0} error={err("stockQuantity")} required />
          <TextField id="warrantyMonths" name="warrantyMonths" label={f.warrantyMonths} inputMode="numeric" defaultValue={product?.warrantyMonths ?? 12} error={err("warrantyMonths")} required />
        </div>
      </fieldset>

      <fieldset className={fieldset} aria-describedby={state.errors.categoryIds ? "categoryIds-error" : undefined}>
        <legend className={legend}>{f.categoryIds}</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <label key={category.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-field)] border border-border px-3.5 text-[15px] hover:border-text-muted">
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                defaultChecked={product?.categoryIds.includes(category.id)}
                className="size-4 accent-[var(--accent)]"
              />
              {category.name[locale]}
            </label>
          ))}
        </div>
        {state.errors.categoryIds && (
          <p id="categoryIds-error" className="text-[13px] font-medium text-danger">
            {err("categoryIds")}
          </p>
        )}
      </fieldset>

      <fieldset className={fieldset}>
        <legend className={legend}>{f.imageUrl}</legend>
        <TextField id="imageUrl" name="imageUrl" label={f.imageUrl} hint={f.imageHint} defaultValue={product?.imageUrl ?? ""} error={err("imageUrl")} />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-medium">
          <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="size-4 accent-[var(--accent)]" />
          {f.isActive}
        </label>
      </fieldset>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-[var(--radius-pill)] border border-border bg-surface/95 p-2 pl-2 shadow-lift backdrop-blur">
        <Button type="submit" disabled={pending}>
          {pending ? dict.admin.saving : dict.admin.save}
        </Button>
        <FormStatus state={state} pending={pending} />
      </div>
    </form>
  );
}
