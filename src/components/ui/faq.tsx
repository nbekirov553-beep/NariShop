import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";

export function Faq({ items, name }: { items: Array<{ q: string; a: string }>; name: string }) {
  return (
    <div className="divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">
      {items.map((item) => (
        <details key={item.q} name={name} className="faq-item group px-5">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-[15px] font-medium transition-colors hover:text-accent">
            {item.q}
            <CaretDownIcon
              size={18}
              aria-hidden
              className="shrink-0 text-text-muted transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-180"
            />
          </summary>
          <p className="max-w-[65ch] pb-5 text-[15px] text-text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
