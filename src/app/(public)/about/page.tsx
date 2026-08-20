import type { Metadata } from "next";
import { ShieldCheck, ExternalLink, FileBadge2 } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag, Stat } from "@/components/public/decor";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { getCmsPage } from "@/lib/cms";
import {
  getPublicLicenseSummaryFromSettings,
  getPublicLicenseDocumentNote,
  type PublicLicenseSettings,
} from "@/lib/static-cms-pages";
import { defaultMetadata } from "@/lib/seo";
import {
  breadcrumbListSchema,
  organizationWithCredentialSchema,
} from "@/lib/schema";
import { sanitizeCmsHtml } from "@/lib/sanitize-cms";
import { getSettings } from "@/lib/settings";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await withTimeoutFallback(getCmsPage("about"), {
    fallback: null,
    label: "about.metadata",
    timeoutMs: 1000,
  });
  return defaultMetadata({
    title:
      page?.seoTitle ??
      page?.title ??
      // Суффикс « | Erfolg» добавит шаблон root layout — свой не пишем.
      "О компании — ООО «Эрфольг»",
    description:
      page?.seoDesc ??
      "ООО «Эрфольг» — сервис и поставка медицинской техники по России. Собственный сервисный центр по лицензии Росздравнадзора (ТОМИ), работа по 44/223-ФЗ.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const [page, license] = await Promise.all([
    withTimeoutFallback(getCmsPage("about"), {
      fallback: null,
      label: "about.page",
      timeoutMs: 1000,
    }),
    withTimeoutFallback(getSettings<PublicLicenseSettings>("license"), {
      fallback: {} as PublicLicenseSettings,
      label: "about.license",
      timeoutMs: 1000,
    }),
  ]);

  return (
    <>
      <JsonLd data={organizationWithCredentialSchema()} />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "О компании", url: "/about" },
        ])}
      />
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "О компании" }]}
      />

      <section className="rails container pb-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(16rem,18rem)] lg:gap-14">
          <div className="max-w-3xl">
            <SectionTag>Компания</SectionTag>
            <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
              {page?.title ?? "О компании"}
            </h1>

            {page?.content ? (
              <div
                className="prose prose-slate mt-7 max-w-none text-foreground prose-headings:font-sans prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-li:marker:text-flame-ink"
                dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(page.content) }}
              />
            ) : (
              <div className="mt-7 space-y-4 text-base leading-7 text-muted-foreground">
                <p>
                  ООО «Эрфольг» — сервис и поставка медицинской техники по всей
                  России. Юридическое лицо зарегистрировано 13 июня 2012 года,
                  ОГРН 1122031001762, ИНН 2014006736.
                </p>
                <p>
                  С государственными клиниками работаем по 44-ФЗ и 223-ФЗ:
                  подбор спецификации под техническое задание, документация
                  под закупку, поставка и ввод в эксплуатацию в согласованный
                  срок. С частными клиниками — по коммерческим договорам,
                  с приоритетом на сроки открытия и пуска отделений.
                </p>
                <p>
                  Сервис ведём на основании лицензии Росздравнадзора на
                  техническое обслуживание медицинских изделий (ТОМИ). На
                  каждый выезд оформляем акт выполненных работ, используем
                  оригинальные запчасти и предоставляем гарантию как на
                  запчасти, так и на сам ремонт.
                </p>
                <p>
                  Реквизиты для проверки в ЕГРЮЛ и оформления договора —
                  в футере сайта и на странице «Контакты». Банковские
                  реквизиты направляем в счёте на оплату.
                </p>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-lg border border-border bg-white">
            <div className="border-b border-border px-5 py-3">
              <span className="tech-label text-muted-foreground">Кратко</span>
            </div>
            <div className="grid gap-6 p-5">
              <Stat value="2012" label="Год регистрации юрлица" />
              <Stat value="44/223" label="ФЗ — работа с госзакупками" />
              <Stat value="ТОМИ" label="Лицензия Росздравнадзора" />
              <Stat value="РФ" label="География поставок" />
            </div>
          </aside>
        </div>
      </section>

      <section className="rails border-t guide-border bg-surface/60">
        <div className="marks-t container py-14">
          <SectionTag>Документы</SectionTag>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            Лицензии и сертификаты
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Поставочное и сервисное направления подтверждены лицензией
            регулятора и реестрами Росздравнадзора
          </p>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-primary">
                  <ShieldCheck
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    Лицензия Росздравнадзора (ТОМИ)
                  </h3>
                  <p className="mt-2 font-mono text-[13px] leading-6 text-foreground">
                    {getPublicLicenseSummaryFromSettings(license)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Техническое обслуживание медицинских изделий — на основании выданной лицензии.
                  </p>
                  <div className="mt-4">
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
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    Как проверить лицензию
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {getPublicLicenseDocumentNote()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "О компании", url: "/about" },
        ])}
      />
    </>
  );
}
