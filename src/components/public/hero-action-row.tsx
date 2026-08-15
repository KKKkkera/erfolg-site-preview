"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { QuoteRequestDialog } from "@/components/public/quote-request-dialog";

/**
 * Строка-оглавление «инженерного паспорта»: крупный индекс → название →
 * описание → действие. Сознательно не карточка — ряды ломают монотонную
 * сетку «трёх равных колонок».
 *
 * Компонент клиентский намеренно. Раньше он жил в серверном page.tsx и для
 * варианта `dialog` отдавал <QuoteRequestDialog><button>…</button></…>.
 * Триггер уезжал в клиентский компонент как children через RSC-границу, и
 * Radix Slot на сервере не признавал его валидным React-элементом: строка
 * «Запрос КП» полностью отсутствовала в серверном HTML и появлялась только
 * после гидрации. Отсюда и Recoverable Error про несовпадение разметки.
 *
 * Теперь и триггер, и диалог создаются по одну сторону границы, поэтому
 * строка приходит в HTML сразу — она видна до загрузки JS и краулерам.
 */
export type HeroActionItem = {
  title: string;
  text: string;
  href?: string;
  kind: "link" | "dialog";
};

const ROW_CLASS =
  "group grid w-full gap-x-8 gap-y-1.5 bg-white px-6 py-5 text-left transition-colors hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[3.5rem_15rem_1fr_auto] md:items-center md:px-8 md:py-6";

export function HeroActionRow({
  title,
  text,
  href,
  kind,
  index,
}: HeroActionItem & { index: number }) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="font-heading text-3xl font-semibold leading-none text-flame-ink md:text-[2.1rem]"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="text-base font-semibold tracking-tight text-foreground md:text-lg">
        {title}
      </span>
      <span className="text-sm leading-6 text-muted-foreground">{text}</span>
      <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary md:mt-0 md:justify-self-end">
        {kind === "dialog" ? "Получить КП" : "Перейти"}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </>
  );

  if (kind === "dialog") {
    return (
      <QuoteRequestDialog source="hero-action">
        <button type="button" className={ROW_CLASS}>
          {content}
        </button>
      </QuoteRequestDialog>
    );
  }

  return (
    <Link href={href ?? "/"} className={ROW_CLASS}>
      {content}
    </Link>
  );
}
