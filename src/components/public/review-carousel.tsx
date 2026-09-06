"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ReviewCard = {
  id: string;
  authorName: string;
  position: string | null;
  organization: string | null;
  city: string | null;
  text: string;
  imageUrl: string | null;
  publishedAt: string | null;
};

function meta(review: ReviewCard): string {
  return [review.position, review.city, review.publishedAt]
    .filter(Boolean)
    .join(" · ");
}

function title(review: ReviewCard): string {
  return review.organization || review.authorName;
}

/**
 * Лента благодарственных писем. Текст письма лежит в разметке целиком и
 * обрезается только визуально (line-clamp) — поисковику достаётся весь
 * текст, читателю — компактная карточка и «Читать» с полным сканом.
 */
export function ReviewCarousel({ reviews }: { reviews: ReviewCard[] }) {
  const swipeable = reviews.length > 1;
  const [emblaRef, embla] = useEmblaCarousel({
    align: "start",
    loop: false,
    active: swipeable,
    containScroll: "trimSnaps",
  });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const onSelect = useCallback(() => {
    setSelected(embla?.selectedScrollSnap() ?? 0);
  }, [embla]);

  /* eslint-disable react-hooks/set-state-in-effect -- Synchronize the initial snapshot of the external Embla instance, then subscribe to its events. */
  useEffect(() => {
    if (!embla) return;
    setSnaps(embla.scrollSnapList());
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
    };
  }, [embla, onSelect]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const active = reviews.find((r) => r.id === openId) ?? null;

  if (reviews.length === 0) return null;

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex select-none items-stretch gap-5 [touch-action:pan-y_pinch-zoom]">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="flex min-w-0 shrink-0 basis-full flex-col rounded-lg border border-border bg-white p-6 sm:basis-[calc(50%-0.625rem)] lg:basis-[calc(33.333%-0.834rem)]"
            >
              {review.imageUrl ? (
                /* Скан без рамки и подложки: только тень, чтобы лист
                   читался как лист, а не как плитка на сером фоне. */
                <button
                  type="button"
                  onClick={() => setOpenId(review.id)}
                  className="relative block h-72 w-full shrink-0 transition-transform hover:-translate-y-0.5 md:h-80"
                  aria-label={`Открыть письмо: ${title(review)}`}
                >
                  <Image
                    src={review.imageUrl}
                    alt={`Благодарственное письмо: ${title(review)}`}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-contain object-top drop-shadow-[0_6px_18px_rgba(15,23,42,0.16)]"
                  />
                </button>
              ) : (
                <Quote className="h-5 w-5 shrink-0 text-flame-ink" aria-hidden="true" />
              )}

              <p className="mt-6 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {review.text}
              </p>
              <button
                type="button"
                onClick={() => setOpenId(review.id)}
                className="mt-auto self-end pt-5 text-sm font-medium text-foreground underline decoration-foreground/25 decoration-1 underline-offset-4 transition-colors hover:text-foreground/75 hover:decoration-foreground/60"
              >
                Читать
              </button>
            </article>
          ))}
        </div>
      </div>

      {swipeable && snaps.length > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            aria-label="Предыдущие отзывы"
            className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            {snaps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => embla?.scrollTo(index)}
                aria-label={`Показать отзывы, группа ${index + 1}`}
                aria-current={index === selected ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === selected
                    ? "w-6 bg-flame"
                    : "w-2 bg-border hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => embla?.scrollNext()}
            aria-label="Следующие отзывы"
            className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <Dialog open={Boolean(active)} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle>{title(active)}</DialogTitle>
              </DialogHeader>
              {meta(active) ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  {meta(active)}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                {active.text}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {active.authorName}
              </p>
              {active.imageUrl ? (
                <Image
                  src={active.imageUrl}
                  alt={`Благодарственное письмо: ${title(active)}`}
                  width={860}
                  height={1215}
                  className="h-auto w-full rounded border border-border"
                />
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
