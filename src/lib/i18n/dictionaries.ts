import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import type ru from "@/messages/ru.json";
import { isLocale, type Locale } from "./config";

export type Dictionary = typeof ru;

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  uz: () => import("@/messages/uz.json").then((module) => module.default),
  ru: () => import("@/messages/ru.json").then((module) => module.default),
  en: () => import("@/messages/en.json").then((module) => module.default),
};

export async function getLocale(): Promise<Locale> {
  const value = await rootLocale();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  return loaders[await getLocale()]();
}

export async function getI18n(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: await loaders[locale]() };
}
