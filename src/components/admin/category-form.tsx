"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldShell, inputStyles, TextField } from "@/components/ui/field";
import { categoryIcons, type CategoryInput } from "@/features/admin/schema";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { localeNames, locales } from "@/lib/i18n/config";
import { saveCategoryAction, type FormState } from "@/server/admin-actions";
import { FormStatus, useAdminError } from "./form-status";
import { keepValuesOnSubmit } from "./use-keep-values";

const initial: FormState = { status: "idle", errors: {} };

const fieldset = "flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6";
const legend = "float-left mb-1 w-full font-display text-lg font-semibold";

export function CategoryForm({ category }: { category: (CategoryInput & { id: string }) | null }) {
  const { dict, locale } = useI18n();
  const [state, action, pending] = useActionState(saveCategoryAction, initial);
  const errorText = useAdminError();
  const f = dict.admin.fields;
  const err = (key: string) => errorText(state.errors[key]);

  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />
      {category && <input type="hidden" name="id" value={category.id} />}

      <fieldset className={fieldset}>
        <legend className={legend}>{dict.admin.nav.categories}</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField id="slug" name="slug" label={f.slug} hint={f.slugHint} defaultValue={category?.slug} error={err("slug")} required />
          <FieldShell id="icon" label={f.icon} error={err("icon")}>
            <select id="icon" name="icon" defaultValue={category?.icon ?? categoryIcons[0]} className={cn(inputStyles, "h-11")}>
              {categoryIcons.map((icon) => (
                <option key={icon} value={icon}>
                  {dict.admin.icons[icon]}
                </option>
              ))}
            </select>
          </FieldShell>
          <TextField id="sortOrder" name="sortOrder" label={f.sortOrder} inputMode="numeric" defaultValue={category?.sortOrder ?? 0} error={err("sortOrder")} required />
        </div>
        <TextField id="imageUrl" name="imageUrl" label={f.imageUrl} hint={f.imageHint} defaultValue={category?.imageUrl ?? ""} error={err("imageUrl")} />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-medium">
          <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} className="size-4 accent-[var(--accent)]" />
          {f.isActive}
        </label>
      </fieldset>

      {locales.map((lang) => (
        <fieldset key={lang} className={fieldset} lang={lang}>
          <legend className={legend}>{localeNames[lang]}</legend>
          <TextField id={`name-${lang}`} name={`name.${lang}`} label={f.name} defaultValue={category?.name[lang]} error={err(`name.${lang}`)} required />
          <TextField
            id={`description-${lang}`}
            name={`description.${lang}`}
            label={f.description}
            defaultValue={category?.description[lang]}
            error={err(`description.${lang}`)}
            required
          />
        </fieldset>
      ))}

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-[var(--radius-pill)] border border-border bg-surface/95 p-2 shadow-lift backdrop-blur">
        <Button type="submit" disabled={pending}>
          {pending ? dict.admin.saving : dict.admin.save}
        </Button>
        <FormStatus state={state} pending={pending} />
      </div>
    </form>
  );
}
