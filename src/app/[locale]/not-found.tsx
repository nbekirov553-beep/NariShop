import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/dictionaries";

export default async function NotFound() {
  const { locale, dict } = await getI18n();
  return (
    <div className="sheet flex flex-col items-start gap-4 py-20">
      <p className="font-display text-6xl font-semibold text-accent">404</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight">{dict.notFound.title}</h1>
      <p className="max-w-[50ch] text-text-muted">{dict.notFound.text}</p>
      <Link href={localePath(locale)} className={buttonStyles()}>
        {dict.notFound.cta}
      </Link>
    </div>
  );
}
