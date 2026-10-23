import type { CategoryIcon } from "@/server/demo/catalog-data";

// Пастельный фон под фото: у каждой категории свой оттенок, чтобы витрина не была однотонной.
const tones: Record<CategoryIcon, string> = {
  smartphone: "bg-tint-sky",
  laptop: "bg-tint-lavender",
  tablet: "bg-tint-butter",
  tv: "bg-tint-peach",
  audio: "bg-tint-pink",
  appliance: "bg-tint-sky",
};

export function toneFor(icon: string): string {
  return icon in tones ? tones[icon as CategoryIcon] : "bg-tint-sky";
}
