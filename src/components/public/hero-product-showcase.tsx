"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export type ShowcaseProduct = {
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  categorySlug: string;
  imageUrl: string | null;
};

const ROTATION_MS = 5500;

export function HeroProductShowcase({ products }: { products: ShowcaseProduct[] }) {
  const [offset, setOffset] = useState(0);
  // Пауза, пока курсор над блоком или фокус внутри него: иначе карточка
  // уезжала из-под курсора ровно в момент клика.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (products.length <= 3) return;
    if (paused) return;
    // Уважаем системную настройку «уменьшить движение» (WCAG 2.2.2):
    // при ней автопрокрутка не запускается вовсе.
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const id = window.setInterval(() => {
      setOffset((o) => (o + 1) % products.length);
    }, ROTATION_MS);
    return () => window.clearInterval(id);
  }, [products.length, paused]);

  if (products.length === 0) return null;

  const visibleCount = Math.min(3, products.length);
  const visible = Array.from({ length: visibleCount }, (_, i) => {
    return products[(offset + i) % products.length];
  });

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="overflow-hidden rounded-lg border border-border bg-white"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        {/* «Из каталога», а не «Из наличия»: позиции поставляются под заказ,
            заявлять физическое наличие на складе нельзя. */}
        <p className="tech-label text-muted-foreground">Из каталога</p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-dark"
        >
          Весь каталог
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {visible.map((p, idx) => (
          <li key={`${p.slug}-${offset}-${idx}`}>
            <Link
              href={`/catalog/${p.categorySlug}/${p.slug}`}
              className="group flex animate-[showcaseIn_400ms_ease-out_both] items-center gap-4 px-4 py-3 transition-colors hover:bg-surface/70 motion-reduce:animate-none"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <span
                aria-hidden="true"
                className="w-6 shrink-0 font-mono text-[11px] font-medium text-flame-ink"
              >
                {String(((offset + idx) % products.length) + 1).padStart(2, "0")}
              </span>
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                    // Оптимизатор Next по умолчанию отвергает SVG (нет
                    // dangerouslyAllowSVG) — без unoptimized иллюстрации
                    // каталога отдавали бы 400 и блок показывал битые картинки.
                    unoptimized={p.imageUrl.toLowerCase().endsWith(".svg")}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    нет фото
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {p.brand ?? p.category}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[13px] font-semibold leading-snug text-foreground">
                  {p.name}
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
