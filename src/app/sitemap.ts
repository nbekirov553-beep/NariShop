import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { infoPages } from "@/lib/info-pages";
import { listAllProductSlugs, listCategories } from "@/server/repositories/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const [categories, slugs] = await Promise.all([listCategories(), listAllProductSlugs()]);
  const paths = [
    "",
    "/catalog",
    ...categories.map((category) => `/catalog/${category.slug}`),
    ...slugs.map((slug) => `/product/${slug}`),
    ...infoPages.map((page) => `/info/${page}`),
  ];

  return paths.map((path) => ({
    url: `${base}/${locales[0]}${path}`,
    alternates: {
      languages: Object.fromEntries(locales.map((locale) => [locale, `${base}/${locale}${path}`])),
    },
  }));
}
