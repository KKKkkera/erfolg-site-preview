"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { siteConfig } from "@/lib/site-config";
import type { CatalogMenuCategory } from "@/components/public/catalog-mega-menu";
import { cn } from "@/lib/utils";

/* Кнопка «Каталог» во второй строке шапки на телефоне и планшете.

   Разделы те же, что в бургере, и раскрываются так же — по шеврону. Ссылкой
   на /catalog кнопка быть не должна: список разделов нужен в один тап, а не
   после перехода на страницу каталога. */

/** Разделы каталога для меню: из базы, а без неё — статический список. */
function catalogLinks(
  categories: CatalogMenuCategory[],
): { href: string; label: string }[] {
  if (categories.length === 0) return siteConfig.nav.catalog;
  return categories.map((category) => ({
    href: `/catalog/category/${category.slug}`,
    label: category.name,
  }));
}

export function MobileCatalogButton({
  categories,
}: {
  categories: CatalogMenuCategory[];
}) {
  const pathname = usePathname();
  // Панель открыта только для того адреса, на котором её открыли. Переход по
  // ссылке внутри панели меняет pathname — иначе она осталась бы раскрытой
  // поверх новой страницы. Сравнение при рендере, а не эффектом: эффект
  // закрывал бы её лишним проходом рендера уже после показа новой страницы.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const close = () => setOpenedAt(null);
  const toggle = () => setOpenedAt((prev) => (prev === pathname ? null : pathname));
  const sections = catalogLinks(categories);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedAt(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="header-catalog-sections"
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-4 text-[0.9375rem] font-medium text-foreground transition-colors hover:bg-accent"
      >
        Каталог
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open ? "rotate-180" : "rotate-0",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <>
          {/* Прозрачная подложка: тап мимо панели закрывает список. Ниже её
              по z-index, поэтому ссылкам не мешает. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={close}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            id="header-catalog-sections"
            className="absolute inset-x-0 top-full z-40 max-h-[70vh] overflow-y-auto overscroll-contain border-b border-border bg-background shadow-lg"
          >
            <div className="container flex flex-col py-2">
              <Link
                href="/catalog"
                className="border-b border-border/70 py-3.5 text-[0.9375rem] font-medium leading-snug text-foreground"
              >
                Весь каталог
              </Link>
              {sections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="border-b border-border/70 py-3.5 text-[0.9375rem] leading-snug text-foreground/80 last:border-b-0"
                >
                  {section.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
