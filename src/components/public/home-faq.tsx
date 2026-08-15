"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HOME_FAQ } from "@/components/public/home-faq-data";
import { SectionTag } from "@/components/public/decor";

export function HomeFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="rails border-b guide-border bg-surface/60">
      <div className="marks container py-14 md:py-16">
        <div className="reveal grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div className="lg:pt-1">
            <SectionTag index="09">Частые вопросы</SectionTag>
            <h2 className="mt-5 text-balance text-2xl font-semibold leading-snug tracking-tight text-foreground md:text-[1.9rem]">
              Что важно знать перед запросом КП
            </h2>
            <p className="mt-4 max-w-[28rem] text-base leading-7 text-muted-foreground">
              Самые частые вопросы клиник и закупочных служб. Если не нашли свой —
              напишите нам, ответим в рабочий день.
            </p>
          </div>

          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-white">
            {HOME_FAQ.map((item, idx) => {
              const isOpen = open === idx;
              return (
                <li key={item.q}>
                  <button
                    type="button"
                    id={`faq-q-${idx}`}
                    onClick={() => setOpen(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    // aria-controls связывает кнопку с её панелью: без него скринридер
                    // объявляет «свёрнуто», но не может сказать, что именно свёрнуто.
                    aria-controls={`faq-a-${idx}`}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:px-6 md:py-5"
                  >
                    <span
                      aria-hidden="true"
                      className="w-6 shrink-0 font-mono text-[11px] font-medium text-flame-ink"
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-[15px] font-medium leading-snug text-foreground md:text-base">
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
                      isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr] pb-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pl-[3.75rem] pr-6 text-sm leading-7 text-muted-foreground md:pl-16">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
