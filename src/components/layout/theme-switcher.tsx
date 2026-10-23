"use client";

import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useLayoutEffect, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";

type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (readPreference() === "system") applyTheme("system");
  };
  media.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(callback);
    media.removeEventListener("change", onSystemChange);
  };
}

function setPreference(preference: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Без localStorage тема применяется только до перезагрузки.
  }
  applyTheme(preference);
  listeners.forEach((listener) => listener());
}

// Выполняется в <head> до первой отрисовки, чтобы не было вспышки светлой темы.
export const themeInitScript = `(function(){try{var p=localStorage.getItem("${STORAGE_KEY}");var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;

const options: Array<{ value: ThemePreference; Icon: typeof SunIcon }> = [
  { value: "light", Icon: SunIcon },
  { value: "dark", Icon: MoonIcon },
  { value: "system", Icon: DesktopIcon },
];

const nextPreference: Record<ThemePreference, ThemePreference> = {
  light: "dark",
  dark: "system",
  system: "light",
};

// Компактная кнопка для шапки: по кругу светлая → тёмная → как в системе.
export function ThemeToggle() {
  const { dict } = useI18n();
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);
  const Icon = options.find((option) => option.value === preference)?.Icon ?? DesktopIcon;
  const label = `${dict.theme.label}: ${dict.theme[preference]}`;

  return (
    <button
      type="button"
      onClick={() => setPreference(nextPreference[preference])}
      aria-label={label}
      title={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-pill)] text-text transition-colors duration-300 hover:bg-fill-hover"
    >
      <Icon key={preference} size={24} aria-hidden className="animate-theme-swap" />
    </button>
  );
}

export function ThemeSwitcher({ withLabels = false }: { withLabels?: boolean }) {
  const { dict } = useI18n();
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  // В dev React пересоздаёт <html> при повторном монтировании и сбрасывает атрибут.
  useLayoutEffect(() => {
    applyTheme(readPreference());
  }, []);

  return (
    <div
      role="group"
      aria-label={dict.theme.label}
      className="inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] bg-fill p-0.5"
    >
      {options.map(({ value, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={withLabels ? undefined : dict.theme[value]}
            title={dict.theme[value]}
            onClick={() => setPreference(value)}
            className={cn(
              "flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius-pill)] text-sm transition-[background-color,color,box-shadow] duration-200",
              withLabels ? "px-3" : "w-8",
              active ? "bg-surface text-text shadow-card" : "text-vibrant hover:text-text",
            )}
          >
            <Icon size={16} weight={active ? "fill" : "regular"} aria-hidden />
            {withLabels && dict.theme[value]}
          </button>
        );
      })}
    </div>
  );
}
