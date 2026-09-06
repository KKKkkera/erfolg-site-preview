import Link from "next/link";
import { Phone } from "lucide-react";

import { siteConfig } from "@/lib/site-config";
import { BrandLogo } from "@/components/public/brand-logo";
import {
  CatalogMegaMenu,
  type CatalogMenuCategory,
} from "@/components/public/catalog-mega-menu";
import { CatalogSearch } from "@/components/public/catalog-search";
import { MobileCatalogButton } from "@/components/public/mobile-catalog-button";
import { MobileNav } from "@/components/public/mobile-nav";
import { LeadDialog } from "@/components/public/lead-dialog";
import { SocialLinks } from "@/components/public/social-links";
import { db } from "@/lib/db";
import { telHref } from "@/lib/utils-format";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

function productWord(count: number): string {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "товаров";
  const last = count % 10;
  if (last === 1) return "товара";
  if (last >= 2 && last <= 4) return "товаров";
  return "товаров";
}

export async function SiteHeader() {
  const [productCount, menuProducts] = await Promise.all([
    withTimeoutFallback(db.product.count({ where: { status: "ACTIVE" } }), {
      fallback: null,
      label: "header.productCount",
      timeoutMs: 500,
    }),
    withTimeoutFallback(
      db.product.findMany({
        where: { status: "ACTIVE" },
        select: {
          slug: true,
          name: true,
          model: true,
          brand: { select: { name: true } },
          category: {
            select: {
              slug: true,
              name: true,
              sort: true,
              parent: { select: { slug: true, name: true, sort: true } },
            },
          },
          images: {
            take: 1,
            orderBy: { sort: "asc" },
            select: { url: true, alt: true },
          },
        },
        orderBy: [{ sort: "asc" }, { name: "asc" }],
        take: 100,
      }),
      {
        fallback: [],
        label: "header.catalogMenu",
        timeoutMs: 800,
      },
    ),
  ]);
  const menuByCategory = new Map<
    string,
    CatalogMenuCategory & { sort: number }
  >();

  for (const product of menuProducts) {
    const rootCategory = product.category.parent ?? product.category;
    const category = menuByCategory.get(rootCategory.slug) ?? {
      slug: rootCategory.slug,
      name: rootCategory.name,
      sort: rootCategory.sort,
      products: [],
    };

    if (category.products.length < 12) {
      category.products.push({
        slug: product.slug,
        name: product.name,
        model: product.model,
        brand: product.brand?.name ?? null,
        imageUrl: product.images[0]?.url ?? null,
        imageAlt: product.images[0]?.alt ?? null,
      });
    }
    menuByCategory.set(rootCategory.slug, category);
  }

  const catalogMenu = [...menuByCategory.values()]
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "ru"))
    .map(({ sort: _sort, ...category }) => category);
  const searchPlaceholder =
    productCount === null
      ? "Поиск по каталогу"
      : `Поиск среди ${productCount} ${productWord(productCount)}`;

  return (
    <div className="sticky top-0 z-50 w-full before:pointer-events-none before:absolute before:inset-x-0 before:-top-px before:hidden before:h-px before:bg-ink before:content-[''] md:before:block">
      {/* Обе строки находятся в одном sticky-контейнере, поэтому браузер
          фиксирует их как единый блок без расхождения на субпикселях. */}
      <div className="hidden border-b border-ink-border/70 bg-ink text-ink-muted md:block">
        <div className="container flex h-9 items-center justify-between gap-6 lg:px-[var(--page-gutter)]">
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
            <SocialLinks />
            <span aria-hidden="true" className="hidden h-3 w-px bg-ink-border lg:block" />
            <span className="hidden lg:inline">Пн–Пт 09:00–18:00</span>
          </div>
        </div>
      </div>

      <header className="relative w-full border-b border-border bg-background">
        <div className="container flex h-[4.25rem] items-center gap-4 lg:px-[var(--page-gutter)]">
          <BrandLogo priority imgClassName="h-9 w-auto sm:h-10" />

          <nav
            className="ml-3 hidden items-center min-[1120px]:flex"
            aria-label="Основные разделы"
          >
            {siteConfig.nav.primary.map((item) =>
              item.href === "/catalog" ? (
                <CatalogMegaMenu key={item.href} categories={catalogMenu} />
              ) : (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="whitespace-nowrap rounded-md px-2.5 py-2 text-[0.9375rem] font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-foreground"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-2 lg:flex-1">
            <div className="hidden min-w-0 flex-1 min-[1120px]:block">
              <CatalogSearch placeholder={searchPlaceholder} />
            </div>

            <a
              href={telHref(siteConfig.contacts.phonePrimary)}
              className="hidden h-10 items-center gap-2.5 rounded-md border border-border px-3.5 transition-colors hover:bg-accent xl:flex"
            >
              <Phone className="h-3.5 w-3.5 text-flame-ink" aria-hidden="true" />
              <span className="whitespace-nowrap font-mono text-[0.8125rem] font-medium tracking-tight text-foreground">
                {siteConfig.contacts.phonePrimary}
              </span>
            </a>

            <a
              href={telHref(siteConfig.contacts.phonePrimary)}
              aria-label={`Позвонить ${siteConfig.contacts.phonePrimary}`}
              className="grid h-10 w-10 place-items-center rounded-md border border-border text-flame-ink transition-colors hover:bg-accent xl:hidden"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>

            <div className="hidden md:inline-flex">
              <LeadDialog
                source="header-cta"
                triggerLabel="Запросить сервис"
                triggerVariant="accent"
                triggerClassName="h-10 px-5"
              />
            </div>

            <MobileNav categories={catalogMenu} />
          </div>
        </div>

        {/* Вторая строка — только на телефоне и планшете: каталог и поиск
            вынесены из-под иконок в постоянную полосу. Это два самых частых
            действия, а раньше каталог жил внутри бургера, а поиск
            разворачивался по кнопке — оба в один тап не открывались. */}
        <div className="border-t border-border min-[1120px]:hidden">
          <div className="container flex items-center gap-2.5 py-2.5">
            <MobileCatalogButton categories={catalogMenu} />

            <div className="min-w-0 flex-1">
              <CatalogSearch placeholder={searchPlaceholder} mobile />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
