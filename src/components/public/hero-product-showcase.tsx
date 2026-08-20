"use client";

import { useEffect, useState } from "react";

import { ProductCard } from "@/components/public/product-card";

export type ShowcaseProduct = {
  id: string;
  slug: string;
  name: string;
  model: string | null;
  regNumber: string | null;
  isUsed: boolean;
  brand: string | null;
  category: string;
  categorySlug: string;
  imageUrl: string | null;
  imageAlt: string | null;
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
      className="border-t border-border bg-white"
    >
      <ul className="grid gap-5 bg-surface/30 px-5 py-6 sm:grid-cols-2 md:px-7 lg:grid-cols-3">
        {visible.map((p, idx) => (
          <li
            key={`${p.id}-${offset}-${idx}`}
            className="animate-[showcaseIn_400ms_ease-out_both] motion-reduce:animate-none"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <ProductCard
              product={{
                id: p.id,
                slug: p.slug,
                name: p.name,
                model: p.model,
                regNumber: p.regNumber,
                isUsed: p.isUsed,
                brand: p.brand ? { name: p.brand } : null,
                category: { name: p.category, slug: p.categorySlug },
                images: p.imageUrl
                  ? [{ url: p.imageUrl, alt: p.imageAlt }]
                  : [],
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
