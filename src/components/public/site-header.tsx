import Link from "next/link";
import { Phone, Search, Share2 } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import { siteConfig } from "@/lib/site-config";
import { BrandLogo } from "@/components/public/brand-logo";
import { MobileNav } from "@/components/public/mobile-nav";
import { QuoteRequestDialog } from "@/components/public/quote-request-dialog";
import { telHref } from "@/lib/utils-format";

type SocialIcon = ComponentType<SVGProps<SVGSVGElement>>;

/* Знаки соцсетей рисуем заливкой, а не обводкой, поэтому это не lucide-иконки:
   fill="currentColor" подхватывает цвет строки и её hover. */
function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" {...props}>
      <path d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z" />
    </svg>
  );
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.463,3.488C18.217,1.24,15.231,0.001,12.05,0C5.495,0,0.16,5.334,0.157,11.892c-0.001,2.096,0.547,4.142,1.588,5.946L0.057,24l6.304-1.654c1.737,0.948,3.693,1.447,5.683,1.448h0.005c6.554,0,11.89-5.335,11.893-11.893C23.944,8.724,22.708,5.735,20.463,3.488z M12.05,21.785h-0.004c-1.774,0-3.513-0.477-5.031-1.378l-0.361-0.214l-3.741,0.981l0.999-3.648l-0.235-0.374c-0.99-1.574-1.512-3.393-1.511-5.26c0.002-5.45,4.437-9.884,9.889-9.884c2.64,0,5.122,1.03,6.988,2.898c1.866,1.869,2.893,4.352,2.892,6.993C21.932,17.351,17.498,21.785,12.05,21.785z M17.472,14.382c-0.297-0.149-1.758-0.868-2.031-0.967c-0.272-0.099-0.47-0.149-0.669,0.148s-0.767,0.967-0.941,1.166c-0.173,0.198-0.347,0.223-0.644,0.074c-0.297-0.149-1.255-0.462-2.39-1.475c-0.883-0.788-1.48-1.761-1.653-2.059s-0.018-0.458,0.13-0.606c0.134-0.133,0.297-0.347,0.446-0.521C9.87,9.97,9.919,9.846,10.019,9.647c0.099-0.198,0.05-0.372-0.025-0.521C9.919,8.978,9.325,7.515,9.078,6.92c-0.241-0.58-0.486-0.501-0.669-0.51C8.236,6.401,8.038,6.4,7.839,6.4c-0.198,0-0.52,0.074-0.792,0.372c-0.272,0.298-1.04,1.017-1.04,2.479c0,1.463,1.065,2.876,1.213,3.074c0.148,0.198,2.095,3.2,5.076,4.487c0.709,0.306,1.263,0.489,1.694,0.626c0.712,0.226,1.36,0.194,1.872,0.118c0.571-0.085,1.758-0.719,2.006-1.413c0.248-0.694,0.248-1.29,0.173-1.413C17.967,14.605,17.769,14.531,17.472,14.382z"
      />
    </svg>
  );
}

function MaxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.215 21.9427c-1.9625 0-2.87502-.2875-4.46085-1.4384-1.0025 1.295-4.17832 2.3067-4.31665.575 0-1.3-.28667-2.3975-.61167-3.5967-.38666-1.4775-.82583-3.1225-.82583-5.5059C2 6.28337 6.65165 2 12.1625 2 17.6783 2 21.9999 6.4942 21.9999 12.0292 22.0183 17.4785 17.6408 21.9143 12.215 21.9427Zm.0808-15.02183c-2.68332-.13917-4.77498 1.72668-5.23831 4.65253-.3825 2.4225.29583 5.3717.87333 5.5251.2775.0675.97499-.4984 1.40916-.935.71782.4985 1.55472.798 2.42582.8684 2.7808.1342 5.1575-1.9917 5.3442-4.7817.1083-2.79587-2.0334-5.16423-4.8142-5.32506v-.00417Z" />
    </svg>
  );
}

/* Временные иконки-заглушки: настоящие знаки соцсетей поставим вместе со ссылками. */
const SOCIAL_ICONS: Record<string, SocialIcon> = {
  telegram: TelegramIcon,
  whatsapp: WhatsAppIcon,
  vk: MaxIcon,
};

export function SiteHeader() {
  return (
    <div className="sticky top-0 z-50 w-full">
      {/* Обе строки находятся в одном sticky-контейнере, поэтому браузер
          фиксирует их как единый блок без расхождения на субпикселях. */}
      <div className="hidden border-b border-ink-border/70 bg-ink text-ink-muted md:block">
        <div className="container flex h-9 items-center justify-between gap-6">
          {/* Строка не дублирует H1 главной: здесь то, чего на первом экране
              нет вовсе — русское название юрлица и ИНН для проверки в ЕГРЮЛ. */}
          <p className="tech-label flex items-center gap-5 truncate tracking-[0.22em]">
            <span>ООО «Эрфольг»</span>
            <span>ИНН 2014006736</span>
          </p>
          <div className="flex shrink-0 items-center gap-4 font-mono text-xs tracking-[0.08em]">
            <a
              href={`mailto:${siteConfig.contacts.email}`}
              className="transition-colors hover:text-white"
            >
              {siteConfig.contacts.email}
            </a>
            <span aria-hidden="true" className="h-3 w-px bg-ink-border" />
            {/* Соцсети. Пока ссылок нет — кликабельная кнопка-заглушка: она
                фокусируется с клавиатуры и подсвечивается, но никуда не ведёт,
                чтобы не отдавать поисковикам битые href="#". */}
            <div className="flex items-center gap-2.5">
              {siteConfig.socials.map((social) => {
                const Icon = SOCIAL_ICONS[social.key] ?? Share2;
                return social.href ? (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="transition-colors hover:text-white"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <button
                    key={social.key}
                    type="button"
                    title={`${social.label} — скоро`}
                    className="cursor-pointer transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{social.label} — скоро</span>
                  </button>
                );
              })}
            </div>
            <span aria-hidden="true" className="hidden h-3 w-px bg-ink-border lg:block" />
            <span className="hidden lg:inline">Пн–Пт 09:00–18:00</span>
          </div>
        </div>
      </div>

      <header className="w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container flex h-[4.25rem] items-center gap-4">
          <BrandLogo priority imgClassName="h-9 w-auto sm:h-10" />

          <nav
            className="ml-4 hidden items-center gap-0.5 xl:flex"
            aria-label="Основные разделы"
          >
            {siteConfig.nav.primary.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3.5 py-2 text-[15px] font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/search"
              aria-label="Поиск по каталогу"
              className="hidden h-10 w-10 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary lg:grid"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Link>

            <a
              href={telHref(siteConfig.contacts.phonePrimary)}
              className="hidden h-10 items-center gap-2.5 rounded-md border border-border px-3.5 transition-colors hover:border-primary lg:flex"
            >
              <Phone className="h-3.5 w-3.5 text-flame-ink" aria-hidden="true" />
              <span className="whitespace-nowrap font-mono text-[13px] font-medium tracking-tight text-foreground">
                {siteConfig.contacts.phonePrimary}
              </span>
            </a>

            <div className="hidden md:inline-flex">
              <QuoteRequestDialog
                source="header-cta"
                triggerLabel="Получить КП"
                triggerVariant="accent"
                triggerClassName="h-10 px-5"
              />
            </div>

            <a
              href={telHref(siteConfig.contacts.phonePrimary)}
              aria-label={`Позвонить ${siteConfig.contacts.phonePrimary}`}
              className="grid h-10 w-10 place-items-center rounded-md border border-border text-flame-ink transition-colors hover:border-flame-ink lg:hidden"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>

            <MobileNav />
          </div>
        </div>
      </header>
    </div>
  );
}
