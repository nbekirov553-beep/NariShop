import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { themeInitScript } from "@/components/layout/theme-switcher";
import { brand } from "@/lib/brand";
import { I18nProvider } from "@/lib/i18n/client";
import { locales } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/dictionaries";
import "../globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getI18n();
  return {
    metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
    title: { default: dict.meta.title, template: `%s | ${brand.name}` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((item) => [item, `/${item}`])),
    },
    openGraph: { siteName: brand.name, locale, type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#a6cddd" },
    { media: "(prefers-color-scheme: dark)", color: "#18303f" },
  ],
};

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const { locale, dict } = await getI18n();

  return (
    <html
      lang={locale}
      data-theme="light"
      suppressHydrationWarning
      className={`${manrope.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col overflow-x-clip">
        <I18nProvider locale={locale} dict={dict}>
          <a
            href="#main"
            className="sr-only z-50 rounded-[var(--radius-pill)] bg-text px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            {dict.nav.skipToContent}
          </a>
          <p className="px-4 pt-2.5 text-center text-xs font-medium text-text/75">{dict.demo.banner}</p>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
