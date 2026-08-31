"use client";

import {
  Award,
  BarChart3,
  HelpCircle,
  LayoutGrid,
  Map,
  Newspaper,
  Send,
  Truck,
  Type,
} from "lucide-react";

import type { BlockIconName } from "@/lib/content-blocks";

/* Миниатюра блока для конструктора.

   Это схематичный эскиз, а не настоящий компонент: конструктор должен
   оставаться лёгким и перетаскиваемым. Карта региона весит 130 КБ, FAQ тянет
   аккордеон — рисовать их по-настоящему в списке из десяти карточек незачем,
   менеджеру нужно узнать блок, а не рассмотреть его. */

export function BlockIcon({
  name,
  className,
}: {
  name: BlockIconName;
  className?: string;
}) {
  const Icon = {
    text: Type,
    map: Map,
    truck: Truck,
    help: HelpCircle,
    award: Award,
    send: Send,
    chart: BarChart3,
    grid: LayoutGrid,
    news: Newspaper,
  }[name];
  return <Icon className={className} aria-hidden="true" />;
}

/** Серые «кирпичики», изображающие строки текста. */
function Bar({ w }: { w: string }) {
  return (
    <div
      className="h-1.5 rounded-full bg-muted-foreground/25"
      style={{ width: w }}
    />
  );
}

export function BlockThumb({
  type,
  params,
}: {
  type: string;
  params: Record<string, string>;
}) {
  switch (type) {
    case "region-coverage":
      return (
        <div className="flex h-16 items-center justify-center rounded bg-muted/60">
          <Map className="h-7 w-7 text-muted-foreground/50" aria-hidden="true" />
        </div>
      );

    case "delivery-cities":
      return (
        <div className="grid h-16 grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-center gap-1 rounded bg-muted/60 p-2"
            >
              <Bar w="70%" />
              <Bar w="45%" />
            </div>
          ))}
        </div>
      );

    case "faq":
      return (
        <div className="flex h-16 flex-col gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded bg-muted/60 px-2 py-1.5"
            >
              <Bar w={i === 0 ? "55%" : i === 1 ? "70%" : "40%"} />
              <span className="text-[10px] text-muted-foreground/50">+</span>
            </div>
          ))}
        </div>
      );

    case "brands":
      return (
        <div className="grid h-16 grid-cols-5 items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex h-9 items-center justify-center rounded bg-muted/60"
            >
              <Award
                className="h-3.5 w-3.5 text-muted-foreground/40"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      );

    case "products":
      return (
        <div className="grid h-16 grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-1 rounded bg-muted/60 p-1.5"
            >
              <div className="flex-1 rounded bg-muted-foreground/15" />
              <Bar w="80%" />
            </div>
          ))}
        </div>
      );

    case "posts":
      return (
        <div className="grid h-16 grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1 rounded bg-muted/60 p-1.5">
              <div className="h-6 rounded bg-muted-foreground/15" />
              <Bar w="90%" />
              <Bar w="55%" />
            </div>
          ))}
        </div>
      );

    case "cta":
      return (
        <div className="flex h-16 flex-col justify-center gap-1.5 rounded bg-muted/60 px-3">
          <div className="truncate text-[11px] font-medium text-foreground/70">
            {params.title || "Заголовок формы"}
          </div>
          <div className="w-fit rounded bg-flame-ink/80 px-2 py-0.5 text-[10px] font-medium text-white">
            {params.button || "Отправить ТЗ"}
          </div>
        </div>
      );

    case "stats": {
      const items = [1, 2, 3, 4]
        .map((n) => ({
          value: params[`value${n}`]?.trim() ?? "",
          label: params[`label${n}`]?.trim() ?? "",
        }))
        .filter((s) => s.value !== "");
      const shown = items.length > 0 ? items : [{ value: "—", label: "цифра" }];
      return (
        <div className="flex h-16 items-center gap-3 rounded bg-muted/60 px-3">
          {shown.slice(0, 4).map((s, i) => (
            <div key={i} className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-foreground/70">
                {s.value}
              </div>
              <div className="truncate text-[9px] uppercase tracking-wide text-muted-foreground/60">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
