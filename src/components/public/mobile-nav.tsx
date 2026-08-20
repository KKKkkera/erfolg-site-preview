"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Mail, Menu, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/lib/site-config";
import { LeadDialog } from "@/components/public/lead-dialog";
import { SocialLinks } from "@/components/public/social-links";
import type { CatalogMenuCategory } from "@/components/public/catalog-mega-menu";
import { cn } from "@/lib/utils";
import { telHref } from "@/lib/utils-format";

/** Разделы каталога для меню: из базы, а без неё — статический список. */
function catalogLinks(
  categories: CatalogMenuCategory[],
): { href: string; label: string }[] {
  if (categories.length === 0) return siteConfig.nav.catalog;
  return categories.map((category) => ({
    href: `/catalog?category=${encodeURIComponent(category.slug)}`,
    label: category.name,
  }));
}

/** Смахнули вправо дальше этого — меню закрывается. */
const SWIPE_CLOSE_PX = 90;

export function MobileNav({
  categories,
}: {
  categories: CatalogMenuCategory[];
}) {
  const [open, setOpen] = useState(false);
  /* «Каталог» раскрывается разделами прямо в меню — то же, что мегаменю
     на десктопе: видно, что внутри, и можно уйти сразу в раздел. */
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const close = () => setOpen(false);
  const sections = catalogLinks(categories);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setDragX(0);
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Открыть меню"
          className="min-[1120px]:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      {/* Панель на три четверти экрана: за ней видно страницу, и понятно, что
          меню — слой поверх, а не отдельный экран. Смахивание вправо закрывает:
          на телефоне это привычнее, чем целиться в крестик. */}
      <SheetContent
        side="right"
        className="flex w-[78%] max-w-sm flex-col gap-0 overflow-y-auto p-0 min-[420px]:w-[72%]"
        style={
          dragX > 0
            ? { transform: `translate3d(${dragX}px, 0, 0)`, transition: "none" }
            : undefined
        }
        onTouchStart={(event) => {
          startX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchMove={(event) => {
          if (startX.current === null) return;
          const delta = (event.touches[0]?.clientX ?? 0) - startX.current;
          setDragX(delta > 0 ? delta : 0);
        }}
        onTouchEnd={() => {
          if (dragX > SWIPE_CLOSE_PX) close();
          else setDragX(0);
          startX.current = null;
        }}
      >
        <SheetHeader className="flex-none border-b border-border px-5 py-4 text-left">
          <SheetTitle className="sr-only">Меню сайта</SheetTitle>
          <Link
            href="/"
            onClick={close}
            aria-label="На главную"
            className="self-start"
          >
            <Image
              src="/brand/erfolg-logo.png"
              alt="Erfolg Medical Engineering"
              width={621}
              height={200}
              sizes="126px"
              className="h-9 w-auto"
            />
          </Link>
        </SheetHeader>

        <nav className="flex-none px-5" aria-label="Основные разделы">
          {siteConfig.nav.primary.map((item) =>
            item.href === "/catalog" ? (
              <div key={item.href} className="border-b border-border/70">
                <button
                  type="button"
                  onClick={() => setCatalogOpen((prev) => !prev)}
                  aria-expanded={catalogOpen}
                  aria-controls="mobile-catalog-sections"
                  className="flex w-full items-center justify-between py-4 text-left text-[17px] font-medium text-foreground"
                >
                  {item.label}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      catalogOpen ? "rotate-180" : "rotate-0",
                    )}
                    aria-hidden="true"
                  />
                </button>

                <div
                  id="mobile-catalog-sections"
                  inert={!catalogOpen}
                  className={cn(
                    "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out",
                    catalogOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col border-l border-border pb-3 pl-4">
                      <Link
                        href="/catalog"
                        onClick={close}
                        className="py-2.5 text-[15px] leading-snug text-foreground/80"
                      >
                        Весь каталог
                      </Link>
                      {sections.map((section) => (
                        <Link
                          key={section.href}
                          href={section.href}
                          onClick={close}
                          className="py-2.5 text-[15px] leading-snug text-foreground/80"
                        >
                          {section.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="block border-b border-border/70 py-4 text-[17px] font-medium text-foreground last:border-b-0"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        {/* Контакты — продолжение того же списка: та же бумага, те же поля. */}
        <div className="mt-auto flex-none px-5 pb-6 pt-6">
          <a
            href={telHref(siteConfig.contacts.phonePrimary)}
            className="flex items-center gap-3"
          >
            <Phone className="h-4 w-4 shrink-0 text-flame-ink" aria-hidden="true" />
            <span>
              <span className="block font-mono text-[17px] font-semibold leading-tight text-foreground">
                {siteConfig.contacts.phonePrimary}
              </span>
              <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                Пн–Пт 09:00–18:00
              </span>
            </span>
          </a>

          <a
            href={`mailto:${siteConfig.contacts.email}`}
            className="mt-4 flex items-center gap-3 text-sm text-foreground"
          >
            <Mail className="h-4 w-4 shrink-0 text-flame-ink" aria-hidden="true" />
            {siteConfig.contacts.email}
          </a>

          <SocialLinks
            className="mt-5 gap-2.5"
            itemClassName="grid h-10 w-10 place-items-center border border-border text-foreground/70 transition-colors hover:border-primary hover:text-foreground"
            iconClassName="h-[18px] w-[18px]"
          />

          <div className="mt-5">
            <LeadDialog
              source="mobile-cta"
              triggerLabel="Получить КП"
              triggerVariant="accent"
              triggerClassName="h-12 w-full text-base"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
