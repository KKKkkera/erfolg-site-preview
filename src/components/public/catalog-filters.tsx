"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** count — число активных товаров; проставляется на странице каталога. */
type FilterCategory = { slug: string; name: string; count?: number };
type FilterBrand = { slug: string; name: string; count?: number };

const KIND_OPTIONS = [
  { value: "", label: "Все типы" },
  { value: "EQUIPMENT", label: "Оборудование" },
  { value: "CONSUMABLE", label: "Расходники" },
  { value: "SPARE_PART", label: "Запчасти" },
];

export function CatalogFilters({
  categories,
  brands,
  selectedCategories = [],
  selectedBrand,
  selectedKind,
  selectedCondition,
  showCategories = true,
}: {
  categories: FilterCategory[];
  brands: FilterBrand[];
  selectedCategories?: string[];
  selectedBrand?: string;
  selectedKind?: string;
  /** "" = все, "new" = только новые, "used" = только Б/У */
  selectedCondition?: string;
  showCategories?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  /* На телефоне фильтры свёрнуты: развёрнутая панель занимала весь первый
     экран каталога, и до товаров приходилось листать вслепую. */
  const [openOnMobile, setOpenOnMobile] = useState(false);
  /* На десктопе панель открыта всегда, поэтому inert вешаем только на узком
     экране — иначе таб уходил бы мимо фильтров там, где они видны. */
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023.98px)");
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const activeCount =
    selectedCategories.length +
    (selectedBrand ? 1 : 0) +
    (selectedKind ? 1 : 0) +
    (selectedCondition ? 1 : 0);

  const update = (next: URLSearchParams) => {
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const toggleCategory = (slug: string) => {
    const current = new Set(params.getAll("category"));
    if (current.has(slug)) current.delete(slug);
    else current.add(slug);
    const next = new URLSearchParams(params.toString());
    next.delete("category");
    for (const c of current) next.append("category", c);
    update(next);
  };

  const setBrand = (slug: string) => {
    const next = new URLSearchParams(params.toString());
    if (!slug || slug === "all") next.delete("brand");
    else next.set("brand", slug);
    update(next);
  };

  const setKind = (kind: string) => {
    const next = new URLSearchParams(params.toString());
    if (!kind) next.delete("kind");
    else next.set("kind", kind);
    update(next);
  };

  const setCondition = (cond: string) => {
    const next = new URLSearchParams(params.toString());
    if (!cond) next.delete("condition");
    else next.set("condition", cond);
    update(next);
  };

  return (
    <aside
      className="h-fit rounded-lg border border-border bg-white"
      aria-busy={isPending}
    >
      <button
        type="button"
        onClick={() => setOpenOnMobile((prev) => !prev)}
        aria-expanded={openOnMobile}
        aria-controls="catalog-filter-panel"
        className={cn(
          // Свёрнутая панель нулевой высоты: линия под шапкой ложилась впритык
          // к рамке блока, и край читался как жирная тень.
          "flex min-h-[3rem] w-full items-center gap-2 px-5 py-3.5 text-left lg:pointer-events-none lg:cursor-default lg:border-b lg:border-border",
          openOnMobile && "border-b border-border",
        )}
      >
        <FilterIcon />
        <h2 className="tech-label text-muted-foreground">Фильтры</h2>
        {activeCount > 0 ? (
          <span className="bg-flame/10 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-flame-ink">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 lg:hidden",
            openOnMobile ? "rotate-180" : "rotate-0",
          )}
          aria-hidden="true"
        />
      </button>

      {/* Раскрывается высотой строки грида — то же движение, что у меню и
          вопросов, вместо мгновенного показа. */}
      <div
        id="catalog-filter-panel"
        inert={narrow && !openOnMobile}
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out lg:grid-rows-[1fr]",
          openOnMobile ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-6 p-5">
            {showCategories && categories.length > 0 ? (
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Категория
                </legend>
                <ul className="mt-3 space-y-2.5">
                  {categories.map((cat) => {
                    const checked = selectedCategories.includes(cat.slug);
                    return (
                      <li key={cat.slug}>
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCategory(cat.slug)}
                            className="h-4 w-4 rounded-sm border-input accent-primary"
                          />
                          <span className="flex-1 leading-5">{cat.name}</span>
                          {typeof cat.count === "number" ? (
                            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                              {cat.count}
                            </span>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            ) : null}

            {brands.length > 0 ? (
              <div>
                {/* Label был не связан с полем, а у кнопки Radix не было названия —
                скринридер объявлял её как безымянную кнопку (axe: button-name). */}
                <Label
                  htmlFor="catalog-brand-filter"
                  className="text-xs font-semibold uppercase tracking-wide text-foreground"
                >
                  Бренд
                </Label>
                <Select value={selectedBrand ?? "all"} onValueChange={setBrand}>
                  <SelectTrigger
                    id="catalog-brand-filter"
                    aria-label="Фильтр по бренду"
                    className="mt-2.5"
                  >
                    <SelectValue placeholder="Все бренды" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все бренды</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.slug} value={brand.slug}>
                        {brand.name}
                        {typeof brand.count === "number"
                          ? ` (${brand.count})`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Тип товара
              </legend>
              <ul className="mt-3 space-y-2.5">
                {KIND_OPTIONS.map((opt) => {
                  const checked = (selectedKind ?? "") === opt.value;
                  return (
                    <li key={opt.value || "all"}>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                        <input
                          type="radio"
                          name="kind"
                          checked={checked}
                          onChange={() => setKind(opt.value)}
                          className="h-4 w-4 border-input accent-primary"
                        />
                        <span className="leading-5">{opt.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Состояние
              </legend>
              <ul className="mt-3 space-y-2.5">
                {CONDITION_OPTIONS.map((opt) => {
                  const checked = (selectedCondition ?? "") === opt.value;
                  return (
                    <li key={opt.value || "all-condition"}>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                        <input
                          type="radio"
                          name="condition"
                          checked={checked}
                          onChange={() => setCondition(opt.value)}
                          className="h-4 w-4 border-input accent-primary"
                        />
                        <span className="leading-5">{opt.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </div>
        </div>
      </div>
    </aside>
  );
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="currentColor"
      className="shrink-0 text-muted-foreground"
    >
      <path d="M11.5 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9.05 3a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0V3h9.05zM4.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2.05 8a2.5 2.5 0 0 1 4.9 0H16v1H6.95a2.5 2.5 0 0 1-4.9 0H0V8h2.05zm9.45 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-2.45 1a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0v-1h9.05z" />
    </svg>
  );
}

const CONDITION_OPTIONS = [
  { value: "", label: "Все" },
  { value: "new", label: "Новое" },
  { value: "used", label: "Б/У" },
];
