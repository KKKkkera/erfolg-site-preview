import Link from "next/link";
import { ChevronRight, FileQuestion } from "lucide-react";

import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { Button } from "@/components/ui/button";
import { LeadDialog } from "@/components/public/lead-dialog";
import { Toaster } from "@/components/ui/sonner";

const QUICK_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/service", label: "Сервис" },
  { href: "/contacts", label: "Контакты" },
];

export default async function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip-link как в (public)/layout: 404 собирает каркас вручную,
          и без него клавиатурному пользователю пришлось бы табать всю шапку */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
      >
        Перейти к основному содержанию
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1">
        <section className="container flex flex-col items-center justify-center py-24 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-md border border-border bg-surface">
            <FileQuestion className="h-8 w-8 text-primary" aria-hidden="true" strokeWidth={1.5} />
          </div>
          <p className="mt-7 font-heading text-6xl font-semibold leading-none tracking-tight text-flame-ink">
            404
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Такой страницы нет
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
            Ссылка устарела или раздел переехал. Откройте каталог
            или раздел сервиса — либо направьте запрос на подбор
            оборудования, менеджер ответит в рабочий день.
          </p>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Button asChild variant="outline">
                  <Link href={link.href}>
                    {link.label}
                    <ChevronRight className="ml-1.5 h-4 w-4" strokeWidth={2.5} />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <LeadDialog
              source="not-found"
              triggerSize="lg"
              triggerVariant="accent"
              triggerLabel="Запросить сервис"
            />
          </div>
        </section>
      </main>
      <SiteFooter />
      <Toaster richColors closeButton position="top-right" />
    </div>
  );
}
