"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { CatalogSearch } from "@/components/public/catalog-search";

/* Поиск на телефоне: в шапке кнопка рядом с телефоном, поле разворачивается
   полосой под шапкой. Закрывается крестиком, тапом мимо и Esc — постоянная
   строка забирала шестую часть экрана, а нужна она не всегда. */
export function MobileSearch({ placeholder }: { placeholder: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="mobile-search-panel"
        aria-label={open ? "Закрыть поиск" : "Поиск по каталогу"}
        className="grid h-10 w-10 place-items-center rounded-md border border-border text-foreground transition-colors hover:bg-accent lg:hidden"
      >
        {open ? (
          <X className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Search className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {open ? (
        <>
          {/* Прозрачная подложка: тап мимо поля закрывает поиск. Ниже панели
              по z-index, поэтому подсказкам не мешает. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="absolute inset-x-0 top-full z-30 h-screen cursor-default lg:hidden"
          />
          <div
            id="mobile-search-panel"
            className="absolute inset-x-0 top-full z-40 border-b border-border bg-background lg:hidden"
          >
            <div className="container py-2.5">
              <CatalogSearch placeholder={placeholder} mobile autoFocus />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
