import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { BrandLogo } from "@/components/public/brand-logo";
import { SocialLinks } from "@/components/public/social-links";

import { siteConfig } from "@/lib/site-config";
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

/* Разделы каталога из футера убраны: список дублировал мегаменю шапки и
   разъезжался с базой — каталог открывается из шапки. */
/* order — только для телефона: в сетке два на два «Контакты» стоят рядом с
   «Компанией», а «Информация» уходит вниз. На десктопе порядок исходный. */
const LINK_GROUPS: {
  title: string;
  order: string;
  links: { href: string; label: string }[];
}[] = [
  {
    title: "Компания",
    order: "order-1",
    links: [
      { href: "/catalog", label: "Каталог" },
      { href: "/about", label: "О компании" },
      { href: "/works", label: "Реализованные проекты" },
      { href: "/reviews", label: "Отзывы" },
      { href: "/blog", label: "Блог" },
      { href: "/contacts", label: "Контакты" },
    ],
  },
  {
    title: "Информация",
    order: "order-4",
    links: [
      { href: "/delivery", label: "Доставка" },
      { href: "/warranty", label: "Гарантия" },
      { href: "/license", label: "Лицензия" },
      { href: "/licenses", label: "Документы" },
    ],
  },
  {
    title: "Помощь",
    order: "order-3",
    links: [
      { href: "/service", label: "Ремонт и обслуживание" },
      { href: "/faq", label: "Частые вопросы" },
    ],
  },
];

export async function SiteFooter() {
  const [company, contacts] = await Promise.all([
    withTimeoutFallback(getSettings<CompanySettings>("company"), {
      fallback: {} as CompanySettings,
      label: "footer.company",
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
  const hasLegalMeta = hasRealValue(company.inn) && hasRealValue(company.ogrn);

  // Вертикальные направляющие страницы доходят до футера и обрываются на нём:
  // класса rails здесь нет намеренно, внутри футера своя сетка.
  return (
    <footer className="bg-ink text-ink-muted">
      <div className="container py-10 sm:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-[1.25fr_0.9fr_0.9fr_0.75fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <BrandLogo imgClassName="h-10 w-auto" />
            {/* Реквизиты строкой на строку: сплошным абзацем ИНН и ОГРН
                глазом не находились. */}
            <div className="mt-5 max-w-sm space-y-1.5 text-xs leading-6 text-ink-muted/85">
              <p>{legalName}</p>
              {hasLegalMeta ? (
                <>
                  <p>
                    ИНН <span className="font-mono text-ink-muted">{inn}</span>
                  </p>
                  <p>
                    ОГРН <span className="font-mono text-ink-muted">{ogrn}</span>
                  </p>
                  <p>Юридический адрес: {legalAddress}</p>
                </>
              ) : null}
            </div>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.title} className={`${group.order} lg:order-none`}>
              <h3 className="tech-label text-white/90">{group.title}</h3>
              <ul className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
                {group.links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-[13px] leading-6 transition-colors hover:text-white sm:text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="order-2 lg:order-none">
            <h3 className="tech-label text-white/90">Контакты</h3>
            <div className="mt-4 space-y-5 text-sm sm:mt-5 sm:space-y-6">
              <SocialLinks className="gap-4" iconClassName="h-[18px] w-[18px]" />
              <a href={telHref(phone)} className="group flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-flame" aria-hidden="true" />
                <span>
                  <span className="block font-mono font-medium text-white transition-colors group-hover:text-flame">
                    {phone}
                  </span>
                  <span className="mt-1.5 block font-mono text-xs text-ink-muted/80">
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
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4 border-t border-ink-border/70 pt-6 text-xs leading-6 text-ink-muted/80">
          {/* Дисклеймер тянется на всю ширину контейнера — как разделитель
              над ним и колонки сверху; max-w обрывал строку на 2/3 футера. */}
          <p>
            Работаем с юридическими лицами и ИП: клиниками, больницами,
            лабораториями и дистрибьюторами. Цены на сайте не указаны и не
            являются публичной офертой — стоимость, комплектацию и срок поставки
            подтверждаем коммерческим предложением и договором.
          </p>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {siteConfig.nav.legal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <p>
            © 2012–{new Date().getFullYear()} {legalName}
          </p>
        </div>
      </div>
    </footer>
  );
}
