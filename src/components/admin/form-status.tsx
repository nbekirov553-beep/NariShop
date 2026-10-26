"use client";

import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n/client";
import type { FormState } from "@/server/admin-actions";

export function useAdminError() {
  const { dict } = useI18n();
  const errors = dict.admin.errors;
  return (code: string | undefined) => (code ? (errors[code as keyof typeof errors] ?? errors.generic) : undefined);
}

export function FormStatus({ state, pending }: { state: FormState; pending: boolean }) {
  const { dict } = useI18n();
  const errorText = useAdminError();
  if (pending) return null;
  if (state.status === "saved") {
    return (
      <span role="status" className="flex items-center gap-1.5 text-sm font-medium text-success">
        <CheckCircleIcon size={18} weight="fill" aria-hidden />
        {dict.admin.saved}
      </span>
    );
  }
  if (state.status === "error") {
    return (
      <span role="alert" className="flex items-center gap-1.5 text-sm font-medium text-danger">
        <WarningCircleIcon size={18} weight="fill" aria-hidden />
        {errorText(state.errors.form ?? "generic")}
      </span>
    );
  }
  return null;
}
