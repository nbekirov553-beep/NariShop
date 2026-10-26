"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface AdminNavItem {
  href: string;
  label: string;
  exact?: boolean;
}

export function AdminNav({ items, label }: { items: AdminNavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto">
      <ul className="flex w-max gap-1 px-1">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center rounded-[var(--radius-pill)] px-4 text-[15px] font-medium transition-colors",
                  active ? "bg-text text-surface" : "text-text hover:bg-fill-hover",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
