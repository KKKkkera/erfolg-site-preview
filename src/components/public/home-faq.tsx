"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HOME_FAQ } from "@/components/public/home-faq-data";

/* Восемь вопросов раскладываем на две колонки по четыре: порядок идёт
   сверху вниз внутри колонки, поэтому режем список пополам, а не через один. */
const HALF = Math.ceil(HOME_FAQ.length / 2);
const FAQ_COLUMNS = [HOME_FAQ.slice(0, HALF), HOME_FAQ.slice(HALF)];

export function HomeFaq() {
  /* Каждый вопрос раскрывается сам по себе: открытых может быть сколько
     угодно, соседние карточки при этом не тянутся. */
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const toggle = (idx: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  return (
    <section className="rails border-b guide-border bg-surface/60">
      <div className="marks container py-14 md:py-16">
        <h2 className="reveal text-center text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.8rem] md:text-[2.1rem]">
          Часто задаваемые вопросы
        </h2>

        <div className="reveal mt-8 grid gap-2 lg:grid-cols-2 lg:gap-x-4">
          {FAQ_COLUMNS.map((column, columnIndex) => (
            <ul key={columnIndex} className="flex flex-col gap-2">
              {column.map((item, itemIndex) => {
                /* Сквозной индекс: состояние одно на обе колонки, поэтому
                   и ключи для aria-атрибутов должны быть уникальны. */
                const idx = columnIndex * HALF + itemIndex;
                const isOpen = open.has(idx);
                return (
                  <li
                    key={item.q}
                    className="overflow-hidden rounded-lg border border-border bg-white"
                  >
                    <button
                      type="button"
                      id={`faq-q-${idx}`}
                      onClick={() => toggle(idx)}
                      aria-expanded={isOpen}
                      // aria-controls связывает кнопку с её панелью: без него скринридер
                      // объявляет «свёрнуто», но не может сказать, что именно свёрнуто.
                      aria-controls={`faq-a-${idx}`}
                      className="flex h-14 w-full items-center gap-4 px-4 text-left transition-colors hover:bg-surface/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:h-[3.75rem] md:px-5"
                    >
                      <span className="line-clamp-2 flex-1 text-sm font-medium leading-tight text-foreground md:text-sm">
                        {item.q}
                      </span>
                      <Plus
                        className={cn(
                          "h-4 w-4 shrink-0 text-flame-ink transition-transform duration-200",
                          isOpen ? "rotate-45" : "rotate-0",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={`faq-a-${idx}`}
                      role="region"
                      aria-labelledby={`faq-q-${idx}`}
                      // Свёрнутая панель имеет нулевую высоту, но текст остаётся в DOM:
                      // без aria-hidden скринридер читал все восемь ответов подряд,
                      // а Ctrl+F находил «скрытое». Анимацию это не ломает.
                      aria-hidden={!isOpen}
                      className={cn(
                        "grid overflow-hidden transition-[grid-template-rows,padding] duration-200 ease-out",
                        isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr] pb-0",
                      )}
                    >
                      <div className="overflow-hidden">
                        {/* Линия отбивает ответ от вопроса. Отступы по краям
                            те же, что у текста, — не во всю карточку. */}
                        <div className="mx-4 border-t border-border/50 pt-3.5 md:mx-5">
                          <p className="text-[0.8125rem] leading-6 text-muted-foreground md:text-sm md:leading-7">
                            {item.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
