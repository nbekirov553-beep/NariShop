import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const inputStyles = cn(
  "w-full rounded-[var(--radius-field)] border border-border bg-surface px-3.5 text-[15px] text-text",
  "placeholder:text-text-muted transition-colors hover:border-text-muted",
  "focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0",
  "aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-60",
);

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[13px] text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextField({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: Omit<FieldShellProps, "children"> & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(inputStyles, "h-11", className)}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: Omit<FieldShellProps, "children"> & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(inputStyles, "min-h-24 py-2.5", className)}
        {...props}
      />
    </FieldShell>
  );
}
