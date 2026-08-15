"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Mail, Menu, Phone, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/lib/site-config";
import { QuoteRequestDialog } from "@/components/public/quote-request-dialog";
import { telHref } from "@/lib/utils-format";

/* Порядок — по частоте обращения закупщика, а не по алфавиту.
   «О компании» и «Блог» уже есть в основной группе, здесь их не дублируем. */
const SECONDARY_NAV = siteConfig.nav.info.filter(
  (item) => item.href !== "/about" && item.href !== "/blog",
);

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Открыть меню"
          className="xl:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-sm flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="sr-only">Меню сайта</SheetTitle>
          <Image
            src="/brand/erfolg-logo.png"
            alt="Erfolg Medical Engineering"
            width={621}
            height={200}
            sizes="126px"
            className="h-9 w-auto self-start"
          />
        </SheetHeader>

        <nav className="mt-6 flex flex-col" aria-label="Основные разделы">
          {siteConfig.nav.primary.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-md px-3 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-3">
                <span aria-hidden="true" className="font-mono text-[11px] text-flame-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          ))}
          {/* Иконка поиска в шапке видна только с lg: — без этого пункта
              на телефоне до /search было не добраться вообще. */}
          <Link
            href="/search"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-3 rounded-md border border-border px-3 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Search className="h-4 w-4 text-primary" aria-hidden="true" />
            Поиск по каталогу
          </Link>
        </nav>

        {/* «Лицензии» и страницы про 44/223-ФЗ — то, ради чего закупщик
            и заходит. Раньше на телефоне до них можно было добраться только
            через футер, то есть пролистав всю главную. */}
        <nav className="mt-6" aria-label="Документы и закупки">
          <h3 className="tech-label px-3 text-muted-foreground">
            Документы и закупки
          </h3>
          <div className="mt-2 flex flex-col">
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-auto border-t pt-5">
          <a
            href={telHref(siteConfig.contacts.phonePrimary)}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent"
          >
            <Phone className="h-4 w-4 shrink-0 text-flame-ink" aria-hidden="true" />
            <span className="font-mono text-[15px] font-medium text-foreground">
              {siteConfig.contacts.phonePrimary}
            </span>
          </a>
          <a
            href={`mailto:${siteConfig.contacts.email}`}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {siteConfig.contacts.email}
          </a>
          <p className="px-3 pt-1 font-mono text-xs text-muted-foreground">
            Пн–Пт 09:00–18:00
          </p>
          <div className="mt-4 px-1 pb-2">
            <QuoteRequestDialog
              source="mobile-cta"
              triggerLabel="Получить КП"
              triggerVariant="accent"
              triggerClassName="w-full"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
