import Link from "next/link";
import { CategoryIcon } from "@/components/catalog/category-icon";
import { getI18n } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/config";
import { listCategories } from "@/server/repositories/catalog";
import { CartLink } from "./cart-link";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { SearchForm } from "./search-form";
import { ThemeToggle } from "./theme-switcher";

export async function Header() {
  const [{ locale, dict }, categories] = await Promise.all([getI18n(), listCategories()]);
  const catalogHref = localePath(locale, "/catalog");

  const links = [
    { href: localePath(locale), label: dict.nav.home },
    { href: catalogHref, label: dict.nav.shop },
    { href: `${localePath(locale)}#collections`, label: dict.nav.collections },
    { href: "#about", label: dict.nav.about },
  ];

  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-30 px-[var(--frame-inset)] pt-3 md:pt-4"
    >
      <div className="header-bar mx-auto flex h-28 max-w-[var(--frame-max)] flex-wrap items-center gap-2 rounded-[calc(var(--radius-frame)-0.5rem)] px-3 py-2 md:h-16 md:flex-nowrap md:gap-4 md:px-5 md:py-0 lg:px-8">
        <div className="flex flex-1 items-center gap-1 lg:basis-0">
          <MobileMenu
            links={links}
            categories={categories.map((category) => ({
              slug: category.slug,
              name: category.name[locale],
              icon: <CategoryIcon icon={category.icon} size={22} />,
            }))}
          />
          <Logo locale={locale} label={dict.nav.home} />
        </div>

        <nav aria-label={dict.nav.main} className="hidden lg:block">
          <ul className="flex items-center gap-1 xl:gap-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex h-11 items-center whitespace-nowrap rounded-[var(--radius-pill)] px-4 text-[15px] font-medium text-text opacity-70 transition-opacity duration-300 hover:opacity-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-end gap-2 lg:flex-1 lg:basis-0">
          <SearchForm
            id="header-search"
            action={catalogHref}
            labels={dict.nav}
            className="hidden transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex md:w-64 xl:w-72 xl:focus-within:w-80"
          />
          <ThemeToggle />
          <CartLink />
        </div>

        <SearchForm id="header-search-mobile" action={catalogHref} labels={dict.nav} className="md:hidden" />
      </div>
    </header>
  );
}
