import { Mail, MapPin, Phone, Clock, ExternalLink } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { LeadForm } from "@/components/public/lead-form";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { FORMS_DISABLED } from "@/lib/feature-flags";
import { siteConfig } from "@/lib/site-config";
import { getSetting, getSettings } from "@/lib/settings";
import { defaultMetadata } from "@/lib/seo";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";
import {
  breadcrumbListSchema,
  localBusinessSchema,
  type CompanySettings,
  type ContactSettings,
} from "@/lib/schema";
import { telHref, formatPhone } from "@/lib/utils-format";

export const revalidate = 300;

export const metadata = defaultMetadata({
  // Без «| Медицинская техника»: шаблон в root layout сам добавляет
  // « | Erfolg», и заголовок вкладки получал двойной суффикс.
  title: "Контакты — телефон, e-mail и реквизиты",
  description:
    "Контакты ООО «Эрфольг»: телефон +7 928 895 70 70, e-mail info@erfolgmt.ru. ИНН и ОГРН для оформления договора. Ответ в рабочий день.",
  path: "/contacts",
});

type Office = {
  region?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  lat?: number;
  lng?: number;
};

function getFallbackOffices(): Office[] {
  return [
    {
      phone: siteConfig.contacts.phonePrimary,
      email: siteConfig.contacts.email,
      hours: "Пн–Пт 09:00–18:00",
    },
  ];
}

const REQUISITES: Array<{ label: string; value: string; mono?: boolean; wide?: boolean }> = [
  { label: "Полное наименование", value: siteConfig.fullName, wide: true },
  { label: "ИНН", value: siteConfig.legal.inn, mono: true },
  { label: "ОГРН", value: siteConfig.legal.ogrn, mono: true },
  { label: "КПП", value: siteConfig.legal.kpp, mono: true },
  {
    label: "Лицензия Росздравнадзора (ТОМИ)",
    value: siteConfig.legal.tomiNumber,
    mono: true,
  },
  {
    label: "Юридический адрес",
    value: siteConfig.legal.legalAddress,
    wide: true,
  },
];

export default async function ContactsPage() {
  const fromDb = await withTimeoutFallback(getSetting<Office[]>("contacts.offices"), {
    fallback: undefined,
    label: "contacts.offices",
    timeoutMs: 1000,
  });
  const rawOffices =
    Array.isArray(fromDb) && fromDb.length > 0 ? fromDb : getFallbackOffices();
  const offices = rawOffices.map(
    ({ address, lat, lng, city, region, ...rest }) => rest,
  );

  let settingsBundle: { company: CompanySettings; contacts: ContactSettings } = {
    company: {} as CompanySettings,
    contacts: {} as ContactSettings,
  };
  const [company, contacts] = await Promise.all([
    withTimeoutFallback(getSettings<CompanySettings & Record<string, unknown>>("company"), {
      fallback: {} as CompanySettings & Record<string, unknown>,
      label: "contacts.company",
      timeoutMs: 1000,
    }),
    withTimeoutFallback(getSettings<ContactSettings & Record<string, unknown>>("contacts"), {
      fallback: {} as ContactSettings & Record<string, unknown>,
      label: "contacts.settings",
      timeoutMs: 1000,
    }),
  ]);
  settingsBundle = { company, contacts };

  return (
    <>
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "Контакты" }]}
      />

      <section className="rails container pb-12">
        <div className="max-w-3xl">
          <SectionTag>Контакты</SectionTag>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            Контакты
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {FORMS_DISABLED
              ? "Свяжитесь по телефону или e-mail. Можно сразу прислать техническое задание или спецификацию конкурса — менеджер ответит в рабочий день. Поставка по всей России."
              : "Свяжитесь по телефону, e-mail или через форму ниже. Можно сразу прислать техническое задание или спецификацию конкурса — менеджер ответит в рабочий день. Поставка по всей России."}
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {offices.map((office, idx) => (
            <OfficeCard key={`office-${idx}`} office={office} />
          ))}
        </div>
      </section>

      <section className="rails border-t guide-border bg-surface/60">
        <div className="marks-t container py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
            <div className="max-w-md">
              <SectionTag>Форма</SectionTag>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
                Напишите нам
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                {FORMS_DISABLED
                  ? "Опишите задачу в письме или по телефону — ответим в рабочий день. Для расчёта цены и срока поставки укажите модель или приложите техническое задание."
                  : "Опишите задачу — ответим в рабочий день. Если нужны цена и срок поставки на конкретную модель, быстрее использовать кнопку «Получить КП» в карточке товара."}
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-white">
              <div className="border-b border-border px-6 py-3.5">
                <span className="tech-label text-muted-foreground">
                  Сообщение · ответ в рабочий день
                </span>
              </div>
              <div className="p-6">
                <LeadForm source="contacts" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rails container py-14">
        <SectionTag>Реквизиты</SectionTag>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          Реквизиты компании
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Информация для проверки в ЕГРЮЛ и оформления договора.
          Банковские реквизиты предоставляем в счёте на оплату
        </p>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {REQUISITES.map((row) => (
            <div
              key={row.label}
              className={(row.wide ? "sm:col-span-2 " : "") + "bg-white p-5"}
            >
              <dt className="tech-label text-muted-foreground">{row.label}</dt>
              <dd
                className={
                  "mt-2 text-foreground " +
                  (row.mono ? "font-mono text-[15px] tracking-tight" : "text-[15px]")
                }
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Банковские реквизиты предоставляем в счёте и проекте договора.
        </p>
      </section>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Контакты", url: "/contacts" },
        ])}
      />
      {offices.map((office, idx) => (
        <JsonLd
          key={`localbiz-${idx}`}
          data={localBusinessSchema(office, settingsBundle)}
        />
      ))}
    </>
  );
}

function OfficeCard({ office }: { office: Office }) {
  const phoneFormatted = office.phone ? formatPhone(office.phone) : null;
  const mapHref =
    office.lat != null && office.lng != null
      ? `https://yandex.ru/maps/?ll=${office.lng},${office.lat}&z=15&pt=${office.lng},${office.lat}`
      : null;

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="border-b border-border px-5 py-3">
        {/* p, а не h3: карточка идёт до первого h2 страницы, и h3 ломал
            иерархию заголовков (h1 → h3 → h2) */}
        <p className="tech-label text-muted-foreground">Связь с менеджером</p>
      </div>
      <ul className="space-y-3 p-5 text-sm text-foreground">
        {office.address ? (
          <li className="flex items-start gap-3">
            <MapPin
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-flame-ink"
              aria-hidden="true"
            />
            <span>{office.address}</span>
          </li>
        ) : (
          <li className="flex items-start gap-3">
            <MapPin
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-flame-ink"
              aria-hidden="true"
            />
            <span>Поставка по всей России</span>
          </li>
        )}
        {office.phone ? (
          <li className="flex items-start gap-3">
            <Phone
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-flame-ink"
              aria-hidden="true"
            />
            <a
              href={telHref(office.phone)}
              className="font-mono text-[15px] font-medium transition-colors hover:text-primary"
            >
              {phoneFormatted ?? office.phone}
            </a>
          </li>
        ) : null}
        {office.email ? (
          <li className="flex items-start gap-3">
            <Mail
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-flame-ink"
              aria-hidden="true"
            />
            <a
              href={`mailto:${office.email}`}
              className="transition-colors hover:text-primary"
            >
              {office.email}
            </a>
          </li>
        ) : null}
        {office.hours ? (
          <li className="flex items-start gap-3">
            <Clock
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-flame-ink"
              aria-hidden="true"
            />
            <span className="font-mono text-[13px] text-muted-foreground">
              {office.hours}
            </span>
          </li>
        ) : null}
      </ul>
      {mapHref ? (
        <div className="border-t border-border px-5 py-4">
          <Button asChild variant="outline" size="sm">
            <a href={mapHref} target="_blank" rel="noopener noreferrer">
              Открыть на Яндекс.Картах
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      ) : null}
    </article>
  );
}
