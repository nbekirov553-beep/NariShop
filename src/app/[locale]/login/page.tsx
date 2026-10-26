import { GoogleLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { buttonStyles } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getI18n } from "@/lib/i18n/dictionaries";
import { localePath, type Locale } from "@/lib/i18n/config";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { auth, isGoogleConfigured } from "@/server/auth";
import { signInWithGoogle } from "@/server/auth-actions";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.auth.signIn, robots: { index: false } };
}

export default async function LoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  const { locale, dict } = await getI18n();

  return (
    <div className="sheet sheet-sky mx-auto flex max-w-xl flex-col items-center gap-6 py-14 text-center sm:py-20">
      <h1 className="font-display text-[clamp(1.9rem,4vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.04em]">
        {dict.auth.loginTitle}
      </h1>
      <p className="max-w-[36ch] text-[15px] font-medium text-text-muted sm:text-base">{dict.auth.loginText}</p>
      <Suspense fallback={<div className="h-13 w-full max-w-sm" />}>
        <LoginPanel locale={locale} dict={dict} searchParams={searchParams} />
      </Suspense>
      <p className="max-w-[40ch] text-[13px] text-text-muted">{dict.auth.terms}</p>
    </div>
  );
}

async function LoginPanel({
  locale,
  dict,
  searchParams,
}: {
  locale: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[locale]/login">["searchParams"];
}) {
  await connection();
  const params = await searchParams;
  const redirectTo = safeRedirectPath(params.callbackUrl, localePath(locale));

  const session = await auth();
  if (session?.user) redirect(redirectTo);

  const errorCode = typeof params.error === "string" ? params.error : null;
  const errors = dict.auth.errors;
  const errorText = errorCode ? (errors[errorCode as keyof typeof errors] ?? errors.default) : null;

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {errorText && (
        <p role="alert" className="rounded-[var(--radius-field)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {errorText}
        </p>
      )}
      {!isGoogleConfigured && (
        <p className="rounded-[var(--radius-field)] bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          {dict.auth.notConfigured}
        </p>
      )}
      <form action={signInWithGoogle}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <button
          type="submit"
          disabled={!isGoogleConfigured}
          className={buttonStyles({ size: "lg", full: true })}
        >
          <GoogleLogoIcon size={20} weight="bold" aria-hidden />
          {dict.auth.withGoogle}
        </button>
      </form>
    </div>
  );
}
