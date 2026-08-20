"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type PostCard = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  /** Дата уже в готовом виде: форматируем на сервере, локаль одна. */
  publishedAt: string | null;
  publishedAtIso: string | null;
};

/**
 * Лента статей на главной. Раньше это была сетка в три колонки: на телефоне
 * она вытягивалась в три полноэкранные карточки подряд. Теперь листается
 * свайпом, а на десктопе те же три карточки в ряд.
 */
export function PostCarousel({ posts }: { posts: PostCard[] }) {
  const [emblaRef, embla] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
  });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    setSelected(embla?.selectedScrollSnap() ?? 0);
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    setSnaps(embla.scrollSnapList());
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  if (posts.length === 0) return null;

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex select-none items-stretch gap-4 [touch-action:pan-y_pinch-zoom] sm:gap-5">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group flex min-w-0 shrink-0 basis-[85%] flex-col overflow-hidden rounded-lg border border-border bg-white transition-colors hover:border-primary/50 sm:basis-[calc(50%-0.625rem)] lg:basis-[calc(33.333%-0.834rem)]"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-surface">
                  {post.coverUrl ? (
                    <Image
                      src={post.coverUrl}
                      alt={post.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 45vw, 85vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </Link>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                {post.publishedAt ? (
                  <time
                    dateTime={post.publishedAtIso ?? undefined}
                    className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    {post.publishedAt}
                  </time>
                ) : null}
                <h3 className="mt-2.5 text-base font-semibold leading-snug tracking-tight text-foreground sm:mt-3 sm:text-lg">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {post.title}
                  </Link>
                </h3>
                {post.excerpt ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {post.excerpt}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>

      {snaps.length > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            aria-label="Предыдущие статьи"
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
                aria-label={`Показать статьи, группа ${index + 1}`}
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
            aria-label="Следующие статьи"
            className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
