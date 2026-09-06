import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

import { CookieBanner } from "@/components/public/cookie-banner";
import { YandexMetrika } from "@/components/seo/yandex-metrika";
import { FORMS_DISABLED, SEO_BLOCK_INDEX } from "@/lib/feature-flags";
import { siteConfig } from "@/lib/site-config";
import { getSetting } from "@/lib/settings";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

/* Manrope — вариативный гротеск (200–800) с кириллицей: и текст, и заголовки.
   --font-heading в globals.css указывает на эту же переменную, второй
   инстанс next/font не нужен — иначе тот же файл качался бы дважды. */
const fontSans = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://erfolgmt.ru";

export async function generateMetadata(): Promise<Metadata> {
  const [yandexVerify, googleVerify] = await Promise.all([
    withTimeoutFallback(getSetting<string>("seo.yandex_verification"), {
      fallback: undefined,
      label: "seo.yandex_verification",
      timeoutMs: 1000,
    }),
    withTimeoutFallback(getSetting<string>("seo.google_verification"), {
      fallback: undefined,
      label: "seo.google_verification",
      timeoutMs: 1000,
    }),
  ]);

  return {
    title: {
      default: "Erfolg — ремонт и сервис медицинской техники по всей России",
      template: "%s | Erfolg",
    },
    description: siteConfig.description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: "/",
      languages: { "ru-RU": "/" },
    },
    verification: {
      yandex: yandexVerify,
      google: googleVerify,
    },
    icons: {
      icon: "/favicon.png",
      apple: "/apple-touch-icon.png",
    },
    robots: SEO_BLOCK_INDEX
      ? { index: false, follow: false, nocache: true }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // В maintenance-режиме не грузим аналитику и cookie-баннер:
  // даже технические cookies — это потенциальная обработка ПДн,
  // которой следует избегать до подачи уведомления в Роскомнадзор.
  const metrikaId = FORMS_DISABLED
    ? undefined
    : await withTimeoutFallback(getSetting<string>("seo.metrika_id"), {
        fallback: undefined,
        label: "seo.metrika_id",
        timeoutMs: 1000,
      });

  return (
    <html lang="ru" className={`h-full ${fontSans.variable}`}>
      {/* suppressHydrationWarning: расширения браузера (ColorZilla и т.п.)
          дописывают в <body> свои атрибуты (cz-shortcut-listen) до гидратации. */}
      <body className="min-h-full font-sans" suppressHydrationWarning>
        {children}
        {FORMS_DISABLED ? null : (
          <>
            <CookieBanner />
            <YandexMetrika metrikaId={metrikaId} />
          </>
        )}
      </body>
    </html>
  );
}
