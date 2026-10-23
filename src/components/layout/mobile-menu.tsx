"use client";

import { ListIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";

interface MobileMenuProps {
  links: Array<{ href: string; label: string }>;
  categories: Array<{ slug: string; name: string; icon: ReactNode }>;
}

export function MobileMenu({ links, categories }: MobileMenuProps) {
  const { locale, dict } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={dict.nav.openMenu}
        aria-haspopup="dialog"
        className="flex size-11 items-center justify-center rounded-[var(--radius-pill)] text-text transition-colors hover:bg-fill-hover lg:hidden"
      >
        <ListIcon size={24} aria-hidden />
      </button>
      <dialog
        ref={dialogRef}
        aria-label={dict.nav.menu}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        className="drawer drawer-left m-0 h-dvh max-h-dvh w-[min(22rem,88vw)] max-w-none rounded-r-[var(--radius-frame)] border-r border-material-edge p-0 text-text material material-thick"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-material-edge px-4">
            <span className="font-display text-lg font-semibold">{dict.nav.menu}</span>
            <button
              type="button"
              onClick={close}
              aria-label={dict.nav.close}
              className="flex size-11 items-center justify-center rounded-[var(--radius-pill)] hover:bg-fill-hover"
            >
              <XIcon size={22} aria-hidden />
            </button>
          </div>
          <nav aria-label={dict.nav.main} className="border-b border-material-edge px-4 py-4">
            <ul className="flex flex-wrap gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="flex h-11 items-center rounded-[var(--radius-pill)] bg-fill px-4 text-[15px] font-semibold transition-colors hover:bg-fill-hover"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={dict.nav.categories} className="flex-1 overflow-y-auto px-2 py-3">
            <Link
              href={localePath(locale, "/catalog")}
              onClick={close}
              className="flex h-12 items-center rounded-[var(--radius-field)] px-3 font-semibold hover:bg-fill-hover"
            >
              {dict.nav.catalog}
            </Link>
            <ul>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={localePath(locale, `/catalog/${category.slug}`)}
                    onClick={close}
                    className="flex h-12 items-center gap-3 rounded-[var(--radius-field)] px-3 text-[15px] hover:bg-fill-hover"
                  >
                    <span className="text-vibrant">{category.icon}</span>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-4 border-t border-material-edge p-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-vibrant">{dict.nav.language}</span>
              <LanguageSwitcher withLabels />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-vibrant">{dict.theme.label}</span>
              <ThemeSwitcher withLabels />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
