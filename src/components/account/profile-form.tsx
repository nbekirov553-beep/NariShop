"use client";

import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useActionState } from "react";
import { keepValuesOnSubmit } from "@/components/admin/use-keep-values";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/client";
import type { FormState } from "@/server/admin-actions";
import { updateProfileAction } from "@/server/profile-actions";
import type { Profile } from "@/server/services/users";

const initial: FormState = { status: "idle", errors: {} };

const sectionTitle = "text-[13px] font-bold uppercase tracking-[0.12em] text-text-muted";

export function ProfileForm({ profile, today }: { profile: Profile; today: string }) {
  const { dict } = useI18n();
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const t = dict.account;
  const errorText = (field: string) => {
    const code = state.errors[field];
    return code ? (t.errors[code as keyof typeof t.errors] ?? t.errors.generic) : undefined;
  };

  return (
    <form noValidate onSubmit={keepValuesOnSubmit(action)} className="flex flex-col gap-6" aria-busy={pending}>
      <fieldset className="flex flex-col gap-4">
        <legend className={`${sectionTitle} mb-4`}>{t.personal}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="profile-first-name"
            name="firstName"
            label={t.firstName}
            defaultValue={profile.firstName}
            autoComplete="given-name"
            maxLength={60}
            required
            error={errorText("firstName")}
          />
          <TextField
            id="profile-last-name"
            name="lastName"
            label={t.lastName}
            defaultValue={profile.lastName ?? ""}
            autoComplete="family-name"
            maxLength={60}
            error={errorText("lastName")}
          />
          <TextField
            id="profile-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            label={t.phone}
            hint={t.phoneHint}
            defaultValue={profile.phone ?? "+998 "}
            autoComplete="tel"
            error={errorText("phone")}
          />
          <TextField
            id="profile-birth-date"
            name="birthDate"
            type="date"
            label={t.birthDate}
            defaultValue={profile.birthDate ?? ""}
            min="1900-01-01"
            max={today}
            autoComplete="bday"
            error={errorText("birthDate")}
          />
        </div>
        {profile.email && (
          <TextField id="profile-email" label={t.email} hint={t.emailHint} value={profile.email} readOnly disabled />
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className={`${sectionTitle} mb-1`}>{t.deliveryTitle}</legend>
        <p className="text-[13px] text-text-muted">{t.deliveryNote}</p>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <TextField
            id="profile-city"
            name="city"
            label={t.city}
            defaultValue={profile.city ?? ""}
            autoComplete="address-level2"
            maxLength={80}
            error={errorText("city")}
          />
          <TextField
            id="profile-address"
            name="address"
            label={t.address}
            hint={t.addressHint}
            defaultValue={profile.address ?? ""}
            autoComplete="street-address"
            maxLength={200}
            error={errorText("address")}
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? t.saving : t.save}
        </Button>
        {!pending && state.status === "saved" && (
          <span role="status" className="flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircleIcon size={18} weight="fill" aria-hidden />
            {t.saved}
          </span>
        )}
        {!pending && state.errors.form && (
          <span role="alert" className="flex items-center gap-1.5 text-sm font-medium text-danger">
            <WarningCircleIcon size={18} weight="fill" aria-hidden />
            {t.errors.generic}
          </span>
        )}
      </div>
    </form>
  );
}
