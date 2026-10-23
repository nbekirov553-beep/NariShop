"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export default function ErrorPage({ retry }: { error: Error; retry: () => void }) {
  const { dict } = useI18n();
  return (
    <div className="sheet flex flex-col items-start gap-4 py-20">
      <WarningCircleIcon size={48} weight="duotone" aria-hidden className="text-danger" />
      <h1 className="font-display text-3xl font-semibold tracking-tight">{dict.error.title}</h1>
      <p className="max-w-[50ch] text-text-muted">{dict.error.text}</p>
      <Button onClick={() => retry()}>{dict.error.retry}</Button>
    </div>
  );
}
