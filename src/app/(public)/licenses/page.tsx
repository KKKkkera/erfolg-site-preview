import type { Metadata } from "next";
import { ShieldCheck, ExternalLink, FileBadge2 } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/site-config";
import { getCmsPage } from "@/lib/cms";
import {
  getPublicLicenseSummaryFromSettings,
  getPublicLicenseDocumentNote,
  type PublicLicenseSettings,
} from "@/lib/static-cms-pages";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";
import { sanitizeCmsHtml } from "@/lib/sanitize-cms";
import { getSettings } from "@/lib/settings";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await withTimeoutFallback(getCmsPage("licenses"), {
    fallback: null,
    label: "licenses.metadata",
    timeoutMs: 1000,
  });
  return defaultMetadata({
    title:
      page?.seoTitle ??
      page?.title ??
      "Лицензии и сертификаты — ООО «Эрфольг»",
    description:
      page?.seoDesc ??
      "Лицензия Росздравнадзора (ТОМИ) на техническое обслуживание медицинских изделий. Регистрационное удостоверение Росздравнадзора на каждое поставляемое изделие.",
    path: "/licenses",
  });
}

export default async function LicensesPage() {
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
        items={[{ href: "/", label: "Главная" }, { label: "Лицензии" }]}
      />

      <section className="rails container pb-12">
        <div className="max-w-3xl">
          <SectionTag>Документы</SectionTag>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            {page?.title ?? "Лицензии и сертификаты"}
          </h1>

          {page?.content ? (
            <div
              className="prose prose-slate mt-7 max-w-none text-foreground prose-headings:font-sans prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-li:marker:text-flame-ink"
              dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(page.content) }}
            />
          ) : (
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Поставочное и сервисное направления деятельности ООО «Эрфольг»
              подтверждены лицензией Росздравнадзора (ТОМИ). Сертификаты
              систем менеджмента качества — по запросу.
            </p>
          )}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-primary">
                <ShieldCheck
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Лицензия Росздравнадзора (ТОМИ)
                </h2>
                <p className="mt-2 font-mono text-[13px] leading-6 text-foreground">
                  {getPublicLicenseSummaryFromSettings(license)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Техническое обслуживание медицинских изделий.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href="https://roszdravnadzor.gov.ru/services/licenses"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Реестр Росздравнадзора
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-input bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-flame-ink">
                <FileBadge2
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Как проверить лицензию
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {getPublicLicenseDocumentNote()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Лицензии", url: "/licenses" },
        ])}
      />
    </>
  );
}
