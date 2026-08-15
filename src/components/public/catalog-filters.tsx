"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
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

  const clearAll = () => {
    update(new URLSearchParams());
  };

  const hasFilters =
    (selectedCategories?.length ?? 0) > 0 ||
    selectedBrand ||
    selectedKind ||
    selectedCondition;

  return (
    <aside
      className="h-fit rounded-lg border border-border bg-white"
      aria-busy={isPending}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="tech-label text-muted-foreground">Фильтры</h2>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-auto p-0 text-xs font-medium text-flame-ink hover:bg-transparent hover:text-flame-ink/80"
          >
            Сбросить
          </Button>
        ) : null}
      </div>

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
            <Select
              value={selectedBrand ?? "all"}
              onValueChange={setBrand}
            >
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
                    {typeof brand.count === "number" ? ` (${brand.count})` : ""}
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
    </aside>
  );
}

const CONDITION_OPTIONS = [
  { value: "", label: "Все" },
  { value: "new", label: "Новое" },
  { value: "used", label: "Б/У" },
];
