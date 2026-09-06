"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type BentoProduct = {
  id: string;
  slug: string;
  name: string;
  model: string | null;
  isUsed: boolean;
  brand: string | null;
  category: string;
  categorySlug: string;
  imageUrl: string | null;
  imageAlt: string | null;
  homeBadge: string | null;
};

function detailHref(p: BentoProduct): string {
  return `/catalog/${p.slug}`;
}

function imageOf(p: BentoProduct): { src: string; alt: string; svg: boolean } {
  const src = p.imageUrl || "/placeholder-product.svg";
  return {
    src,
    alt: p.imageAlt || `${p.name}${p.model ? ` — ${p.model}` : ""}`,
    svg: src.endsWith(".svg"),
  };
}

function HomeBadge({ text }: { text: string | null }) {
  if (!text) return null;

  return (
    <span className="pointer-events-none absolute left-2 top-2 z-[2] bg-flame/10 px-1.5 py-0.5 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.06em] text-flame-ink sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[0.6875rem] sm:tracking-[0.08em]">
      {text}
    </span>
  );
}

/** Малая плитка: картинка сверху, подпись снизу. */
function SmallTile({ product }: { product: BentoProduct }) {
  const img = imageOf(product);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-colors duration-200 hover:border-primary active:border-primary-dark has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <div className="relative min-h-0 flex-1 bg-white">
        <HomeBadge text={product.homeBadge} />
        <div className="relative h-32 w-full sm:h-40 lg:h-52">
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(min-width: 1024px) 31vw, 50vw"
            className="object-contain p-4 sm:p-5 lg:p-6 transform-gpu will-change-transform [backface-visibility:hidden] transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            draggable={false}
            unoptimized={img.svg}
          />
        </div>
      </div>

      <div className="flex min-h-[4.75rem] flex-none flex-col gap-1.5 border-t border-border p-3 sm:min-h-[5.25rem] sm:p-4 lg:h-24 lg:min-h-0 lg:gap-2 lg:p-5">
        <h3 className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug tracking-tight text-foreground sm:text-sm lg:text-[0.9375rem]">
          <Link
            href={detailHref(product)}
            className="transition-colors after:absolute after:inset-0 after:z-[1] after:content-[''] hover:text-primary focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>
        <p className="line-clamp-1 font-mono text-[0.625rem] font-medium uppercase tracking-[0.1em] text-muted-foreground lg:text-[0.6875rem] lg:tracking-[0.12em]">
          {product.model ?? product.category}
        </p>
      </div>
    </article>
  );
}

/** Позиций на слайде: на десктопе три равные плитки в ряд,
    на телефоне — четыре, сеткой два на два. */
const PAGE_SIZE = 3;
const COMPACT_PAGE_SIZE = 4;
/** Пауза автопрокрутки по умолчанию, мс. Меняется в админке:
    настройка home.bento_autoplay_seconds. */
const DEFAULT_AUTOPLAY_MS = 6000;

function chunk(products: BentoProduct[], size: number): BentoProduct[][] {
  const pages: BentoProduct[][] = [];
  for (let i = 0; i < products.length; i += size) {
    pages.push(products.slice(i, i + size));
  }
  return pages;
}

/** Страница десктопа: три равные плитки в ряд. Крупной плитки нет —
    блок стал ниже, следующая секция попадает в первый экран. */
function BentoGrid({ products }: { products: BentoProduct[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((p) => (
        <SmallTile key={p.id} product={p} />
      ))}
    </div>
  );
}

/** Страница телефона: четыре равные плитки два на два, без крупной. */
function CompactGrid({ products }: { products: BentoProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {products.map((p) => (
        <SmallTile key={p.id} product={p} />
      ))}
    </div>
  );
}

/**
 * Бенто-сетка примеров из каталога. Отмеченных в админке товаров может быть
 * больше пяти — тогда набор превращается в карусель: каждый слайд той же
 * раскладки, но с другими позициями. Листается свайпом, стрелками, точками
 * и сам собой раз в пять секунд.
 */
export function ProductBento({
  products,
  autoplayMs = DEFAULT_AUTOPLAY_MS,
}: {
  products: BentoProduct[];
  /** Пауза автолистания. 0 — листать только вручную. */
  autoplayMs?: number;
}) {
  /* Ширину меряем сами: раскладки разные не только классами — на телефоне
     на слайде четыре позиции, на десктопе пять. */
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023.98px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const pageSize = compact ? COMPACT_PAGE_SIZE : PAGE_SIZE;
  const pages = chunk(products, pageSize);
  const swipeable = pages.length > 1;
  const autoplays = swipeable && autoplayMs > 0;

  const [emblaRef, embla] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      active: swipeable,
      /* Один свайп — ровно одна страница: без инерции и без перескока через
         страницу, даже если смахнули резко. duration — ход самой прокрутки. */
      dragFree: false,
      skipSnaps: false,
      slidesToScroll: 1,
      duration: 30,
      dragThreshold: 12,
    },
    autoplays
      ? [
          Autoplay({
            delay: autoplayMs,
            stopOnMouseEnter: true,
            stopOnInteraction: false,
          }),
        ]
      : [],
  );
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    setSelected(embla?.selectedScrollSnap() ?? 0);
    /* Отсчёт до автопрокрутки начинается заново после любой смены слайда:
       свайпнул сам — пауза отсчитывается от этого момента, а не от
       прошлого автоматического хода. */
    embla?.plugins()?.autoplay?.reset();
  }, [embla]);

  /* Смена ширины меняет и число плиток на слайде: без reInit embla считает
     позиции по старой раскладке, и соседние слайды выглядывают по краям. */
  useEffect(() => {
    if (!embla) return;
    embla.reInit();
  }, [embla, compact, pages.length]);

  /* eslint-disable react-hooks/set-state-in-effect -- Synchronize the initial snapshot of the external Embla instance, then subscribe to its events. */
  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect).on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
    };
  }, [embla, onSelect]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Просили не анимировать — оставляем ручное листание без автопрокрутки.
  useEffect(() => {
    if (!embla) return;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    embla.plugins()?.autoplay?.stop();
  }, [embla]);

  if (pages.length === 0) return null;

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        {/* select-none: при протяжке мышью браузер иначе выделяет подписи
            карточек, и слайд «тащит» за собой синюю подсветку текста. */}
        <div className="-ml-5 flex select-none [touch-action:pan-y_pinch-zoom] sm:-ml-8">
          {pages.map((page, index) => (
            <div key={page[0]?.id ?? index} className="min-w-0 shrink-0 basis-full pl-5 sm:pl-8">
              {compact ? (
                <CompactGrid products={page} />
              ) : (
                <BentoGrid products={page} />
              )}
            </div>
          ))}
        </div>
      </div>

      {swipeable ? (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            aria-label="Предыдущие позиции"
            className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            {pages.map((page, index) => (
              <button
                key={page[0]?.id ?? index}
                type="button"
                onClick={() => embla?.scrollTo(index)}
                aria-label={`Показать позиции ${index * pageSize + 1}–${
                  index * pageSize + page.length
                }`}
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
            aria-label="Следующие позиции"
            className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
