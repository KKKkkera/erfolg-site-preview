"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type ClientCard = {
  id: string;
  /** Заказчик — то, что читается в карточке первым. */
  name: string;
  city: string | null;
  category: string | null;
  /** Что именно сделали: поставка, монтаж, сервисный договор. */
  summary: string;
  imageUrl: string | null;
};

/**
 * Лента заказчиков на главной: фотография объекта, название учреждения,
 * город и одна строка о работе. Листается свайпом на телефоне и стрелками
 * на десктопе — карточек больше, чем помещается в один экран.
 */
export function ClientCarousel({ clients }: { clients: ClientCard[] }) {
  const swipeable = clients.length > 1;
  const [emblaRef, embla] = useEmblaCarousel({
    align: "start",
    loop: false,
    active: swipeable,
    containScroll: "trimSnaps",
    skipSnaps: true,
  });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const pageSnaps = useMemo(() => {
    if (snaps.length === 0) return [];

    const pages: number[] = [];
    const lastSnap = snaps.length - 1;
    for (let index = 0; index <= lastSnap; index += 3) pages.push(index);
    if (pages.at(-1) !== lastSnap) pages.push(lastSnap);
    return pages;
  }, [snaps]);
  const activePage = pageSnaps.reduce((closest, snap, index) => {
    return Math.abs(snap - selected) < Math.abs(pageSnaps[closest] - selected)
      ? index
      : closest;
  }, 0);

  const onSelect = useCallback(() => {
    setSelected(embla?.selectedScrollSnap() ?? 0);
  }, [embla]);

  const scrollByCards = useCallback(
    (amount: number) => {
      if (!embla) return;
      const lastSnap = embla.scrollSnapList().length - 1;
      const target = Math.max(
        0,
        Math.min(embla.selectedScrollSnap() + amount, lastSnap),
      );
      embla.scrollTo(target);
    },
    [embla],
  );

  useEffect(() => {
    if (!embla) return;
    setSnaps(embla.scrollSnapList());
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  if (clients.length === 0) return null;

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex select-none items-stretch gap-5 [touch-action:pan-y_pinch-zoom]">
          {clients.map((client) => (
            <article
              key={client.id}
              className="flex min-w-0 shrink-0 basis-[85%] flex-col overflow-hidden rounded-lg border border-border bg-white sm:basis-[calc(50%-0.625rem)] lg:basis-[calc(33.333%-0.834rem)]"
            >
              <div className="relative aspect-[16/10] shrink-0 border-b border-border bg-surface">
                {client.imageUrl ? (
                  <Image
                    src={client.imageUrl}
                    alt={client.name}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 85vw"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">
                  {client.name}
                </h3>
                {client.city ? (
                  <p className="mt-1 text-sm font-medium leading-6 text-foreground/75">
                    {client.city}
                  </p>
                ) : null}
                {/* Описание работы — третий уровень чтения: тон бледнее города,
                    чтобы карточка читалась как «заказчик → город → детали». */}
                <p className="mt-3 text-sm leading-6 text-muted-foreground/85">
                  {client.summary}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {swipeable && snaps.length > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => scrollByCards(-3)}
            aria-label="Предыдущие три клиента"
            className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            {pageSnaps.map((snap, index) => (
              <button
                key={snap}
                type="button"
                onClick={() => embla?.scrollTo(snap)}
                aria-label={`Показать клиентов, группа ${index + 1}`}
                aria-current={index === activePage ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === activePage
                    ? "w-6 bg-flame"
                    : "w-2 bg-border hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollByCards(3)}
            aria-label="Следующие три клиента"
            className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
