"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  REGION_INDEX,
  type RegionIndexItem,
} from "@/components/public/russia-regions-index";

/* Выбор региона для телефона: карта на 375px нечитаема, а 86 контуров —
   нерабочие цели для пальца. Вместо неё поле поиска: набираешь название,
   выбираешь регион из подсказок. */

/** Ё и е в поиске считаем одной буквой: «Тюмень» ищут и так, и так. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/ё/g, "е").trim();
}

function RegionLink({ region }: { region: RegionIndexItem }) {
  return (
    <Link
      href={`/regions/${region.slug}`}
      className="flex min-h-[2.75rem] items-center justify-between gap-3 border-t border-border/70 px-4 py-2.5 text-[15px] leading-6 text-foreground transition-colors first:border-t-0 active:bg-surface"
    >
      <span className="min-w-0">{region.name}</span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground/70"
        aria-hidden="true"
      />
    </Link>
  );
}

export function RegionPicker({ className }: { className?: string }) {
  const [query, setQuery] = useState("");

  const search = normalize(query);
  const found = useMemo(() => {
    if (search.length < 2) return null;
    return REGION_INDEX.filter((region) =>
      normalize(region.name).includes(search),
    );
  }, [search]);

  return (
    <div className={cn("border border-border bg-white", className)}>
      <div className="p-4">
        <label htmlFor="region-search" className="tech-label text-muted-foreground">
          Выберите регион
        </label>
        <div className="relative mt-2.5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/45"
            aria-hidden="true"
          />
          <input
            id="region-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Начните вводить название"
            autoComplete="off"
            className="h-11 w-full border border-input bg-white pl-9 pr-9 text-base text-foreground outline-none placeholder:text-muted-foreground/45 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Очистить поиск"
              className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-muted-foreground/60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Подсказки открываются с двух букв: вываливать все 86 строк — то же
          самое, от чего ушли, отказавшись от карты. */}
      {found ? (
        found.length > 0 ? (
          <div
            className="max-h-[17rem] overflow-y-auto overscroll-contain border-t border-border"
            aria-live="polite"
          >
            {found.map((region) => (
              <RegionLink key={region.code} region={region} />
            ))}
          </div>
        ) : (
          <p
            className="border-t border-border px-4 py-5 text-sm leading-6 text-muted-foreground"
            aria-live="polite"
          >
            Такого региона в списке нет — проверьте написание. Работаем по всей
            России, поэтому поставку обсудим в любом случае
          </p>
        )
      ) : null}
    </div>
  );
}
