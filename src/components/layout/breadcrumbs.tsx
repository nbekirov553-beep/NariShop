import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function Breadcrumbs({ items, label }: { items: Array<{ name: string; href?: string }>; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-text-muted">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-1">
            {index > 0 && <CaretRightIcon size={12} aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="hover:text-text hover:underline">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-text">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
