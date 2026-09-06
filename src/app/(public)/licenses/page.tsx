import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ExternalLink, FileBadge2, FileText } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/site-config";
import { getCmsPage } from "@/lib/cms";
import {
  getPublicLicenseSummaryFromSettings,
  type PublicLicenseSettings,
} from "@/lib/static-cms-pages";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";
import { getSettings } from "@/lib/settings";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 3600;

/* Подписи к правовым документам: сам список берём из siteConfig.nav.legal,
   чтобы страница и правовая строка футера не разъезжались. Документ без
   подписи выведется без неё — это не ошибка. */
const LEGAL_DESCRIPTIONS: Record<string, string> = {
  "/privacy":
    "Как сайт обрабатывает данные посетителей: цели, сроки, передача третьим лицам, права субъекта.",
  "/personal-data-policy":
    "Полный документ по ст. 18.1 152-ФЗ: основания, категории данных, порядок обработки и уничтожения.",
  "/consent":
    "Текст согласия, которое подтверждает посетитель при отправке формы обратной связи.",
  "/cookie-policy":
    "Категории файлов cookie, цели обработки, сроки хранения и порядок отзыва согласия.",
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await withTimeoutFallback(getCmsPage("licenses"), {
    fallback: null,
    label: "licenses.metadata",
    timeoutMs: 1000,
  });
  return defaultMetadata({
    title: page?.seoTitle ?? page?.title ?? "Документы — ООО «Эрфольг»",
    description:
      page?.seoDesc ??
      "Разрешительные и правовые документы ООО «Эрфольг»: лицензия Росздравнадзора, регистрационные удостоверения, политики обработки персональных данных и cookie.",
    path: "/licenses",
  });
}

export default async function DocumentsPage() {
  const [page, license] = await Promise.all([
    withTimeoutFallback(getCmsPage("licenses"), {
      fallback: null,
      label: "licenses.page",
      timeoutMs: 1000,
    }),
    withTimeoutFallback(getSettings<PublicLicenseSettings>("license"), {
      fallback: {} as PublicLicenseSettings,
      label: "licenses.license",
      timeoutMs: 1000,
    }),
  ]);

  return (
    <>
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "Документы" }]}
      />

      <section className="rails container pb-12 pt-2">
        {/* Заголовок и вводный абзац сняты — страница открывается сразу
            карточками. h1 оставлен скрытым: без него у страницы не остаётся
            заголовка первого уровня для поиска и скринридеров. */}
        <h1 className="sr-only">{page?.title ?? "Документы"}</h1>

        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Разрешительные документы
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <Link
            href="/license"
            className="group rounded-lg border border-border bg-white p-6 transition-colors hover:border-primary"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  Лицензия Росздравнадзора (ТОМИ)
                </h3>
                <p className="mt-2 font-mono text-[0.8125rem] leading-6 text-foreground">
                  {getPublicLicenseSummaryFromSettings(license)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Номер, дата, перечень работ и порядок проверки в реестре.
                </p>
              </div>
            </div>
          </Link>

          <a
            href="https://roszdravnadzor.gov.ru/services/misearch"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border border-dashed border-input bg-white p-6 transition-colors hover:border-primary"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-flame-ink">
                <FileBadge2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  Регистрационные удостоверения
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Каждое поставляемое изделие имеет действующее РУ. Номер
                  подтверждаем в коммерческом предложении, проверить можно в
                  государственном реестре медицинских изделий.
                </p>
              </div>
            </div>
          </a>
        </div>

        <h2 className="mt-12 text-base font-semibold tracking-tight text-foreground">
          Правовые документы сайта
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {siteConfig.nav.legal.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border border-border bg-white p-6 transition-colors hover:border-primary"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-primary">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {item.label}
                  </h3>
                  {LEGAL_DESCRIPTIONS[item.href] ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {LEGAL_DESCRIPTIONS[item.href]}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Документы", url: "/licenses" },
        ])}
      />
    </>
  );
}
