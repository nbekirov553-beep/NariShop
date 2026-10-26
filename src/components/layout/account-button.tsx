"use client";

import { GaugeIcon, PackageIcon, SignOutIcon, UserCircleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";
import { signOutAction } from "@/server/auth-actions";

export interface AccountUser {
  name: string | null;
  email: string | null;
  image: string | null;
  isStaff?: boolean;
}

const menuItem =
  "flex h-11 w-full items-center gap-2.5 rounded-[calc(var(--radius-card)-0.5rem)] px-3 text-[15px] font-medium transition-colors hover:bg-fill-hover";

const iconButton =
  "flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-pill)] text-text transition-colors duration-300 hover:bg-fill-hover";

function initials(user: AccountUser): string {
  const source = user.name || user.email || "?";
  return source
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({ user, size }: { user: AccountUser; size: number }) {
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt=""
        width={size}
        height={size}
        unoptimized={user.image.startsWith("/")}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex items-center justify-center rounded-full bg-sky-deep text-xs font-bold text-cloud"
      style={{ width: size, height: size }}
    >
      {initials(user)}
    </span>
  );
}

export function AccountButton({ user }: { user: AccountUser | null }) {
  const { dict, locale } = useI18n();
  const pathname = usePathname();
  const closeMenu = () => document.getElementById("account-menu")?.hidePopover();

  if (!user) {
    return (
      <Link
        href={`${localePath(locale, "/login")}?callbackUrl=${encodeURIComponent(pathname)}`}
        aria-label={dict.auth.signIn}
        title={dict.auth.signIn}
        className={iconButton}
      >
        <UserCircleIcon size={26} aria-hidden />
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        popoverTarget="account-menu"
        aria-label={dict.auth.accountMenu}
        title={user.name ?? user.email ?? dict.auth.account}
        className={iconButton}
      >
        <Avatar user={user} size={30} />
      </button>
      <div
        id="account-menu"
        popover="auto"
        className="account-popover material material-thick fixed inset-auto right-[var(--frame-inset)] top-[calc(var(--header-h)+0.5rem)] m-0 w-72 rounded-[var(--radius-card)] p-2 text-text shadow-lift"
      >
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar user={user} size={40} />
          <div className="flex min-w-0 flex-col leading-tight">
            {user.name && <span className="truncate text-[15px] font-semibold">{user.name}</span>}
            {user.email && <span className="truncate text-[13px] text-text-muted">{user.email}</span>}
          </div>
        </div>
        <Link href={localePath(locale, "/account")} className={menuItem} onClick={closeMenu}>
          <PackageIcon size={18} aria-hidden />
          {dict.auth.myOrders}
        </Link>
        {user.isStaff && (
          <Link href={localePath(locale, "/admin")} className={menuItem} onClick={closeMenu}>
            <GaugeIcon size={18} aria-hidden />
            {dict.auth.admin}
          </Link>
        )}
        <form action={signOutAction} className="mt-1 border-t border-border pt-1">
          <input type="hidden" name="redirectTo" value={pathname} />
          <button type="submit" className={menuItem}>
            <SignOutIcon size={18} aria-hidden />
            {dict.auth.signOut}
          </button>
        </form>
      </div>
    </>
  );
}
