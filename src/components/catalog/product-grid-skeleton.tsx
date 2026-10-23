export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
        >
          <div className="aspect-square skeleton bg-surface-muted" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-3 w-16 skeleton rounded-full bg-surface-muted" />
            <div className="h-4 w-full skeleton rounded-full bg-surface-muted" />
            <div className="h-4 w-2/3 skeleton rounded-full bg-surface-muted" />
            <div className="mt-2 h-6 w-1/2 skeleton rounded-full bg-surface-muted" />
            <div className="mt-2 h-9 w-full skeleton rounded-full bg-surface-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}
