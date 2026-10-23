import Link from "next/link";
import { getI18n } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/config";
import { infoPages } from "@/lib/info-pages";
import { listCategories } from "@/server/repositories/catalog";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { ThemeSwitcher } from "./theme-switcher";

export async function Footer() {
  const [{ locale, dict }, categories] = await Promise.all([getI18n(), listCategories()]);
  const linkClass = "text-sm text-text-muted transition-colors duration-300 hover:text-text";

  return (
    <footer
      id="about"
      data-theme="dark"
      className="mx-auto mb-[var(--frame-inset)] mt-6 w-[calc(100%-2*var(--frame-inset))] max-w-[var(--frame-max)] scroll-mt-28 rounded-[var(--radius-frame)] bg-ink text-text"
    >
      <div className="grid gap-10 px-6 py-12 sm:px-10 md:grid-cols-[1.4fr_1fr_1fr] lg:px-14 lg:py-16">
        <div className="flex max-w-sm flex-col gap-4">
          <Logo locale={locale} label={dict.nav.home} size="lg" />
          <p className="text-[15px] text-text-muted">{dict.footer.about}</p>
        </div>
        <nav aria-labelledby="footer-buyers">
          <h2 id="footer-buyers" className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
            {dict.footer.buyers}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {infoPages.map((page) => (
              <li key={page}>
                <Link href={localePath(locale, `/info/${page}`)} className={linkClass}>
                  {dict.info.pages[page].title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-catalog">
          <h2 id="footer-catalog" className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
            {dict.footer.catalog}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={localePath(locale, `/catalog/${category.slug}`)} className={linkClass}>
                  {category.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="flex flex-col gap-4 border-t border-border px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-14">
        <p className="text-[13px] text-text-muted">© {dict.footer.rights}</p>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </footer>
  );
}
