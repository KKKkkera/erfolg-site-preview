import type { Metadata } from "next";
import Link from "next/link";

import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ProductCard } from "@/components/public/product-card";
import { CatalogFilters } from "@/components/public/catalog-filters";
import { CatalogPagination } from "@/components/public/catalog-pagination";
import { EmptyState } from "@/components/public/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import {
  loadCatalogProducts,
  parseCatalogPage,
  productCountWord,
  PAGE_SIZE,
  type CatalogProducts,
} from "@/lib/catalog-query";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema, itemListSchema } from "@/lib/schema";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 120;

type SearchParams = Record<string, string | string[] | undefined>;

const CATALOG_DESCRIPTION =
  "Каталог медицинской техники ООО «Эрфольг»: оборудование, расходные материалы, запчасти. Регистрационное удостоверение Росздравнадзора, доставка по России.";

/**
 * Метаданные зависят от строки запроса, поэтому это функция, а не константа.
 *
 * Страницы пагинации получают собственный canonical (?page=N) и свой заголовок:
 * со статичным canonical на /catalog все страницы выдачи схлопывались в одну,
 * и товары со второй и дальше в индекс не попадали.
 *
 * Выдача с фильтрами — noindex, follow. Комбинаций категория×бренд×вид×состояние
 * тысячи, содержимое у них пересекается, и в индексе это дубли каталога; follow
 * оставлен, чтобы вес по ссылкам на карточки всё равно тёк.
 */
export async function generateMetadata(props: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const searchParams = await props.searchParams;

  const hasFilters =
    pickArr(searchParams.category).length > 0 ||
    Boolean(pickStr(searchParams.brand)) ||
    Boolean(pickStr(searchParams.kind)) ||
    Boolean(pickStr(searchParams.condition)) ||
    (pickStr(searchParams.q) ?? "").trim().length >= 2;

  const page = parseCatalogPage(searchParams.page);

  return defaultMetadata({
    title:
      page > 1
        ? `Каталог медицинского оборудования — страница ${page}`
        : "Каталог медицинского оборудования",
    description: CATALOG_DESCRIPTION,
    path: page > 1 ? `/catalog?page=${page}` : "/catalog",
    noindex: hasFilters,
    followWhenNoindex: true,
  });
}

function pickStr(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function pickArr(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function CatalogPage(
  props: {
    searchParams: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const selectedCategories = pickArr(searchParams.category);
  const selectedBrand = pickStr(searchParams.brand);
  const selectedKind = pickStr(searchParams.kind);
  const selectedCondition = pickStr(searchParams.condition);
  const selectedQuery = (pickStr(searchParams.q) ?? "").trim();
  const page = parseCatalogPage(searchParams.page);

  let categories: FilterOption[] = [];
  let brands: FilterOption[] = [];
  let products: CatalogProducts = {
    items: [],
    total: 0,
  };

  try {
    // 1200 мс, а не 350: на боевом сервере (2 ядра, рядом CRM и две БД)
    // холодный запрос легко выходил за 350 мс, и посетитель получал
    // «пустой каталог» с фолбэком вместо товаров.
    [categories, brands, products] = await Promise.all([
      withTimeoutFallback(loadCategoryFilters(), {
        fallback: [] as FilterOption[],
        label: "catalog.categories",
        timeoutMs: 1200,
      }),
      withTimeoutFallback(loadBrandFilters(), {
        fallback: [] as FilterOption[],
        label: "catalog.brands",
        timeoutMs: 1200,
      }),
      loadCatalogProducts({
          categorySlugs: selectedCategories,
          brandSlug: selectedBrand,
          kind: selectedKind,
          condition: selectedCondition,
          query: selectedQuery,
          page,
        }),
    ]);
  } catch (e) {
    throw e;
  }

  const totalPages = Math.max(1, Math.ceil(products.total / PAGE_SIZE));
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    Boolean(selectedBrand) ||
    Boolean(selectedKind) ||
    Boolean(selectedCondition) ||
    selectedQuery.length >= 2;

  return (
    <>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Каталог", url: "/catalog" },
        ])}
      />
      {products.items.length > 0 ? (
        <JsonLd
          data={itemListSchema({
            name: "Каталог медицинского оборудования Erfolg",
            url: "/catalog",
            items: products.items.map((p) => ({
              name: p.name,
              url: `/catalog/${p.slug}`,
              image: p.images[0]?.url ?? null,
            })),
          })}
        />
      ) : null}
      <Breadcrumbs items={[{ href: "/", label: "Главная" }, { label: "Каталог" }]} />

      <section className="rails container pb-16">
        <h1 className="sr-only">Каталог медицинского оборудования</h1>
        <div className="grid items-start gap-8 lg:grid-cols-[260px_1fr]">
          <CatalogFilters
            categories={categories}
            brands={brands}
            selectedCategories={selectedCategories}
            selectedBrand={selectedBrand}
            selectedKind={selectedKind}
            selectedCondition={selectedCondition}
          />

          <div>
            {products.items.length > 0 ? (
              <>
                <div className="flex items-center gap-3">
                  <p className="tech-label text-muted-foreground">
                    {hasActiveFilters ? (
                      <>
                        Найдено {products.total} {productCountWord(products.total)}
                      </>
                    ) : (
                      <>
                        Показано {products.items.length} из {products.total} товаров
                      </>
                    )}
                  </p>
                  {hasActiveFilters ? (
                    <Link
                      href="/catalog"
                      scroll={false}
                      className="shrink-0 text-xs font-medium text-flame-ink transition-colors hover:text-flame-ink/80"
                    >
                      Сбросить
                    </Link>
                  ) : null}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {products.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                <CatalogPagination
                  page={page}
                  totalPages={totalPages}
                  basePath="/catalog"
                  searchParams={searchParams}
                />
              </>
            ) : (
              <EmptyState
                title={
                  selectedQuery.length >= 2
                    ? "По запросу ничего не найдено"
                    : "Подбор по запросу"
                }
                description={
                  selectedQuery.length >= 2
                    ? `По запросу «${selectedQuery}» позиций нет. Попробуйте изменить формулировку или сбросить фильтры.`
                    : "По выбранным параметрам позиций нет. Напишите, какое оборудование нужно, — подберём под задачу и пришлём КП."
                }
                quoteCta={{ label: "Получить КП", source: "catalog-empty" }}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export type FilterOption = { slug: string; name: string; count: number };

/**
 * Категории верхнего уровня со счётчиком активных товаров, включая товары
 * подкатегорий. Разделы без товаров в фильтр не выводим: иначе половина
 * чекбоксов ведёт в пустую выдачу.
 */
async function loadCategoryFilters(): Promise<FilterOption[]> {
  const [cats, counts] = await Promise.all([
    db.category.findMany({
      select: { id: true, slug: true, name: true, parentId: true },
      orderBy: [{ sort: "asc" }, { name: "asc" }],
    }),
    db.product.groupBy({
      by: ["categoryId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
  ]);

  const byCategoryId = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  const childrenOf = new Map<string, string[]>();
  for (const c of cats) {
    if (!c.parentId) continue;
    const list = childrenOf.get(c.parentId) ?? [];
    list.push(c.id);
    childrenOf.set(c.parentId, list);
  }

  return cats
    .filter((c) => !c.parentId)
    .map((c) => {
      const own = byCategoryId.get(c.id) ?? 0;
      const kids = (childrenOf.get(c.id) ?? []).reduce(
        (sum, id) => sum + (byCategoryId.get(id) ?? 0),
        0,
      );
      return { slug: c.slug, name: c.name, count: own + kids };
    })
    .filter((c) => c.count > 0);
}

/** Бренды, у которых есть активные товары. Остальные вели в пустую выдачу. */
async function loadBrandFilters(): Promise<FilterOption[]> {
  const [brands, counts] = await Promise.all([
    db.brand.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.product.groupBy({
      by: ["brandId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
  ]);

  const byBrandId = new Map(counts.map((b) => [b.brandId, b._count._all]));
  return brands
    .map((b) => ({ slug: b.slug, name: b.name, count: byBrandId.get(b.id) ?? 0 }))
    .filter((b) => b.count > 0);
}
