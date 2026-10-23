import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import Form from "next/form";
import { cn } from "@/lib/cn";

interface SearchFormProps {
  action: string;
  id: string;
  labels: { search: string; searchShort: string; searchSubmit: string };
  className?: string;
}

export function SearchForm({ action, id, labels, className }: SearchFormProps) {
  return (
    <Form action={action} role="search" className={cn("relative flex w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {labels.search}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        maxLength={100}
        autoComplete="off"
        placeholder={labels.searchShort}
        className={cn(
          "h-11 w-full rounded-[var(--radius-pill)] bg-cloud pl-11 pr-4 text-sm font-medium text-ink",
          "shadow-[inset_0_0_0_1px_rgb(8_9_12/0.06),0_8px_20px_-12px_rgb(20_70_95/0.45)]",
          "transition-[box-shadow,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "placeholder:text-ink/55 hover:bg-white",
          "focus-visible:shadow-[0_0_0_5px_rgb(115_191_213/0.55)] focus-visible:outline-none",
        )}
      />
      <button
        type="submit"
        aria-label={labels.searchSubmit}
        className="absolute left-1 top-1 flex size-9 items-center justify-center rounded-[var(--radius-pill)] text-ink transition-transform duration-300 hover:scale-110"
      >
        <MagnifyingGlassIcon size={17} weight="bold" aria-hidden />
      </button>
    </Form>
  );
}
