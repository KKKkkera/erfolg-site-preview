import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { BrandLogo } from "@/components/public/brand-logo";
import { PulseLine } from "@/components/public/decor";
import { siteConfig } from "@/lib/site-config";
import { getVisibleCategorySlugs } from "@/lib/catalog-visibility";
import { getSettings } from "@/lib/settings";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";
import { telHref } from "@/lib/utils-format";

type CompanySettings = {
  legal_name?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  legal_address?: string;
};

type LicenseSettings = {
  tomi_number?: string;
  tomi_date?: string;
  tomi_authority?: string;
};

type ContactsSettings = {
  phone?: string;
  email?: string;
};

function pick(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (
    trimmed === "" ||
    trimmed.includes("[") ||
    trimmed.includes("XXX") ||
    /укажет|заказчик/i.test(trimmed)
  ) {
    return fallback;
  }
  return trimmed;
}

function hasRealValue(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return (
    trimmed !== "" &&
    !trimmed.includes("[") &&
    !trimmed.includes("XXX") &&
    !/укажет|заказчик/i.test(trimmed)
  );
}

function formatLicense(license: LicenseSettings): string {
  const number = license.tomi_number?.trim() || siteConfig.legal.tomiNumber;
  const date = license.tomi_date?.trim() || siteConfig.legal.tomiDate;
  if (!number || number.startsWith("[")) {
    return siteConfig.legal.licenseTomi;
  }
  return date
    ? `Лицензия Росздравнадзора № ${number} от ${date}`
    : `Лицензия Росздравнадзора № ${number}`;
}

export async function SiteFooter() {
  // Без slice: категорий семь, и «Запчасти» молча выпадали из футера.
  // Ненаполненные разделы прячем — раньше «Расходники», «Запчасти» и
  // «Офтальмология и ЛОР» вели с каждой страницы сайта в пустую категорию.
  const visibleCategories = await getVisibleCategorySlugs();
  const topCatalog = siteConfig.nav.catalog.filter((item) =>
    visibleCategories.has(item.href.replace("/catalog/", "")),
  );
  // Три пункта вели на один и тот же /service — развели по разным целям.
  const serviceLinks = [
    { href: "/service", label: "Ремонт и обслуживание" },
    { href: "/warranty", label: "Гарантия" },
    { href: "/delivery", label: "Доставка" },
    { href: "/licenses", label: "Лицензия и РУ" },
  ];

  const [company, license, contacts] = await Promise.all([
    withTimeoutFallback(getSettings<CompanySettings>("company"), {
      fallback: {} as CompanySettings,
      label: "footer.company",
      timeoutMs: 1000,
    }),
    withTimeoutFallback(getSettings<LicenseSettings>("license"), {
      fallback: {} as LicenseSettings,
      label: "footer.license",
      timeoutMs: 1000,
    }),
    withTimeoutFallback(getSettings<ContactsSettings>("contacts"), {
      fallback: {} as ContactsSettings,
      label: "footer.contacts",
      timeoutMs: 1000,
    }),
  ]);

  const legalName = pick(company.legal_name, siteConfig.fullName);
  const inn = pick(company.inn, siteConfig.legal.inn);
  const ogrn = pick(company.ogrn, siteConfig.legal.ogrn);
  const legalAddress = pick(
    company.legal_address,
    siteConfig.legal.legalAddress,
  );

  const phone = pick(contacts.phone, siteConfig.contacts.phonePrimary);
  const email = pick(contacts.email, siteConfig.contacts.email);
  const licenseLine = formatLicense(license);
  const hasLegalMeta =
    hasRealValue(company.inn) && hasRealValue(company.ogrn);

  return (
    <footer className="rails relative overflow-hidden bg-ink text-ink-muted">
      {/* Пульс-линия по верхней кромке — мотив из логотипа */}
      <div className="border-b border-ink-border/60">
        <PulseLine className="h-7 w-full text-flame/80" />
      </div>


      {/* Декоративная подпись-водяной знак */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-heading text-[11rem] font-semibold leading-none tracking-tight text-white/[.025]"
      >
        ERFOLG
      </span>

      <div className="container relative py-14">
        <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.9fr_0.85fr_0.95fr_1.05fr]">
          <div className="md:col-span-2 lg:col-span-1">
            <BrandLogo imgClassName="h-10 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-7">
              {siteConfig.description}
            </p>
            {hasRealValue(license.tomi_number) || siteConfig.legal.tomiNumber ? (
              <p
                className="mt-5 max-w-sm font-mono text-xs leading-6 text-ink-muted/90"
                title={
                  license.tomi_authority ??
                  siteConfig.legal.tomiAuthority ??
                  "Федеральная служба по надзору в сфере здравоохранения"
                }
              >
                {licenseLine}
              </p>
            ) : null}
            <p className="mt-6 text-xs leading-5 text-ink-muted/80">
              © 2012–{new Date().getFullYear()} ООО «Эрфольг». Все права защищены.
              <br />
              Оператор персональных данных в реестре Роскомнадзора № 20-25-004617.
            </p>
          </div>

          <div>
            <h3 className="tech-label text-white/90">Каталог</h3>
            <ul className="mt-5 space-y-2.5">
              {topCatalog.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm leading-6 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="tech-label text-white/90">Компания</h3>
            <ul className="mt-5 space-y-2.5">
              {siteConfig.nav.info.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm leading-6 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="tech-label text-white/90">Сервис и поддержка</h3>
            <ul className="mt-5 space-y-2.5">
              {serviceLinks.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    className="text-sm leading-6 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="tech-label text-white/90">Контакты</h3>
            <div className="mt-5 space-y-4 text-sm">
              <a
                href={telHref(phone)}
                className="group flex items-start gap-3"
              >
                <Phone className="mt-1 h-4 w-4 shrink-0 text-flame" aria-hidden="true" />
                <span>
                  <span className="block font-mono text-base font-medium text-white transition-colors group-hover:text-flame">
                    {phone}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs text-ink-muted/80">
                    Пн–Пт 09:00–18:00
                  </span>
                </span>
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-start gap-3 transition-colors hover:text-white"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-flame" aria-hidden="true" />
                <span>{email}</span>
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-flame" aria-hidden="true" />
                <span>Поставка по всей России</span>
              </div>
              <Link
                href="/contacts"
                className="inline-flex text-sm font-medium text-white underline-offset-4 transition-colors hover:text-flame hover:underline"
              >
                Реквизиты и контакты
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-ink-border/70 pt-6">
          <h3 className="tech-label text-white/90">География поставки</h3>
          <p className="mt-2.5 text-xs leading-5 text-ink-muted/80">
            Поставляем по всей России. Ниже — посадочные страницы для регионов
            частых поставок:
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {[
              { slug: "grozny", label: "Грозный" },
              { slug: "vladikavkaz", label: "Владикавказ" },
              { slug: "makhachkala", label: "Махачкала" },
              { slug: "nazran", label: "Назрань" },
              { slug: "nalchik", label: "Нальчик" },
              { slug: "stavropol", label: "Ставрополь" },
              { slug: "cherkessk", label: "Черкесск" },
              { slug: "rostov", label: "Ростов-на-Дону" },
              { slug: "krasnodar", label: "Краснодар" },
              { slug: "voronezh", label: "Воронеж" },
            ].map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/postavka/${c.slug}`}
                  className="inline-flex rounded border border-ink-border px-2.5 py-1.5 text-xs leading-5 transition-colors hover:border-flame/70 hover:text-white"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 border-t border-ink-border/70 pt-5">
          <div className="flex flex-col gap-3 text-xs leading-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              {hasLegalMeta ? (
                <p className="xl:max-w-[46rem]">
                  {legalName}, ИНН <span className="font-mono">{inn}</span>, ОГРН{" "}
                  <span className="font-mono">{ogrn}</span>. Юридический адрес:{" "}
                  {legalAddress}. Банковские реквизиты — в счёте и проекте
                  договора.
                </p>
              ) : (
                <p className="xl:max-w-[42rem]">
                  {legalName}. Сервис и поставка медицинской техники по всей России.
                </p>
              )}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {siteConfig.nav.legal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
