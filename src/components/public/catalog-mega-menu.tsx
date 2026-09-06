"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

export type CatalogMenuCategory = {
  slug: string;
  name: string;
  products: {
    slug: string;
    name: string;
    model: string | null;
    brand: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
  }[];
};

export function CatalogMegaMenu({
  categories,
}: {
  categories: CatalogMenuCategory[];
}) {
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? "");
  /* Курсор на «Весь каталог» — подсветку активного раздела снимаем,
     иначе в колонке горят сразу две строки. */
  const [allHovered, setAllHovered] = useState(false);
  /* Панель шире, чем расстояние от «Каталога» до правого края окна:
     на 1150–1300px она уезжала за экран. Сдвигаем её влево ровно на
     величину выхода за край. */
  const [shift, setShift] = useState(0);
  const activeCategory =
    categories.find((category) => category.slug === activeSlug) ?? categories[0];

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const { left } = trigger.getBoundingClientRect();
      const gutter = 16;
      const width = Math.min(
        16 * 64, // w-[min(64rem,…)]
        window.innerWidth - 2 * gutter,
      );
      const overflow = left + width - (window.innerWidth - gutter);
      setShift(overflow > 0 ? Math.round(Math.min(overflow, left - gutter)) : 0);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  if (!activeCategory) {
    return (
      <Link href="/catalog" className="whitespace-nowrap rounded-md px-2.5 py-2 text-[0.9375rem] font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-foreground">
        Каталог
      </Link>
    );
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setAllHovered(false);
      }}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <Link
        ref={triggerRef}
        href="/catalog"
        aria-haspopup="true"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-0.5 whitespace-nowrap rounded-md px-2.5 py-2 text-[0.9375rem] font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-foreground",
          open && "bg-accent text-foreground",
        )}
      >
        Каталог
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-flame-ink transition duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </Link>

      <div
        aria-hidden={!open}
        style={{ left: -shift }}
        className={cn(
          "absolute top-full z-[80] w-[min(64rem,calc(100vw-2rem))] pt-2 transition duration-150",
          open
            ? "visible translate-y-0 opacity-100"
            : "pointer-events-none invisible -translate-y-1 opacity-0",
        )}
      >
        <div className="grid min-h-80 grid-cols-[18rem_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-white shadow-2xl">
          <div className="border-r border-border bg-surface/65 py-3">
            <Link
              href="/catalog"
              onClick={() => setOpen(false)}
              onMouseEnter={() => setAllHovered(true)}
              onMouseLeave={() => setAllHovered(false)}
              onFocus={() => setAllHovered(true)}
              onBlur={() => setAllHovered(false)}
              className="mx-3 mb-2 flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Весь каталог
              {/* Цвет не задаём — шеврон наследует currentColor строки,
                  то есть ровно тот же тон, что и её текст. */}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <div className="max-h-[min(32rem,65vh)] overflow-y-auto px-3">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/catalog/category/${category.slug}`}
                  onMouseEnter={() => setActiveSlug(category.slug)}
                  onFocus={() => setActiveSlug(category.slug)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md px-3 py-3 text-sm font-medium leading-snug text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground focus:outline-none",
                    !allHovered &&
                      activeCategory.slug === category.slug &&
                      "bg-accent text-foreground",
                  )}
                >
                  <span>{category.name}</span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-foreground/60"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
              <p className="text-sm font-semibold text-foreground">
                {activeCategory.name}
              </p>
              <Link
                href={`/catalog/category/${activeCategory.slug}`}
                onClick={() => setOpen(false)}
                className="whitespace-nowrap text-xs font-medium text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors hover:text-foreground/70 hover:decoration-foreground/60"
              >
                Все товары раздела
              </Link>
            </div>

            <div className="mt-3 grid max-h-[min(28rem,58vh)] grid-cols-2 gap-1 overflow-y-auto pr-1">
              {activeCategory.products.map((product) => {
                const image = product.imageUrl || "/placeholder-product.svg";
                const meta = [product.brand, product.model]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <Link
                    key={product.slug}
                    href={`/catalog/${product.slug}`}
                    onClick={() => setOpen(false)}
                    className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-surface focus:bg-surface focus:outline-none"
                  >
                    <span className="relative block h-12 w-12 overflow-hidden rounded-sm border border-border bg-white">
                      <Image
                        src={image}
                        alt={product.imageAlt || product.name}
                        fill
                        sizes="48px"
                        className="object-contain p-1.5"
                        unoptimized={image.endsWith(".svg")}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-snug text-foreground">
                        {product.name}
                      </span>
                      {meta ? (
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {meta}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
