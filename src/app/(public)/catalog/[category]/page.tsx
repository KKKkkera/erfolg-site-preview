import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { ProductCard } from "@/components/public/product-card";
import { CategoryCard } from "@/components/public/category-card";
import { CatalogFilters } from "@/components/public/catalog-filters";
import { CatalogPagination } from "@/components/public/catalog-pagination";
import { EmptyState } from "@/components/public/empty-state";
import { QuoteRequestDialog } from "@/components/public/quote-request-dialog";
import { JsonLd } from "@/components/seo/json-ld";
import { categoryMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 180;

const PAGE_SIZE = 24;

type SearchParams = Record<string, string | string[] | undefined>;

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: SearchParams;
};

async function loadCategory(slug: string) {
  try {
    return await db.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          orderBy: [{ sort: "asc" }, { name: "asc" }],
        },
      },
    });
  } catch (e) {
    // Ошибку БД пробрасываем дальше: раньше здесь возвращался null, и
    // существующая категория при недоступной базе отдавала посетителю
    // (и краулеру) 404 вместо честной 500-страницы.
    console.error("category load error", e);
    throw e;
  }
}

/**
 * Товары раздела вместе с товарами его подкатегорий: в корневых разделах
 * («Реанимация», «Лабораторное оборудование») товары лежат не напрямую,
 * а в дочерних категориях — по точному categoryId страница была пустой.
 */
async function loadCategoryProducts({
  categoryIds,
  brandSlug,
  kind,
  condition,
  page,
}: {
  categoryIds: string[];
  brandSlug?: string;
  kind?: string;
  condition?: string;
  page: number;
}) {
  try {
    const where: Prisma.ProductWhereInput = {
      categoryId: { in: categoryIds },
      status: "ACTIVE",
    };
    if (brandSlug) where.brand = { slug: brandSlug };
    if (kind === "EQUIPMENT" || kind === "CONSUMABLE" || kind === "SPARE_PART") {
      where.kind = kind;
    }
    if (condition === "used") where.isUsed = true;
    if (condition === "new") where.isUsed = false;

    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
          images: { take: 1, orderBy: { sort: "asc" } },
        },
        orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      db.product.count({ where }),
    ]);
    return { items, total };
  } catch (e) {
    console.error("category products load error", e);
    return { items: [], total: 0 };
  }
}

/**
 * Бренды, представленные внутри этого раздела. Фильтр по брендам из всего
 * каталога здесь бесполезен: половина чекбоксов вела бы в пустую выдачу.
 */
async function loadCategoryBrands(
  categoryIds: string[],
): Promise<{ slug: string; name: string; count: number }[]> {
  try {
    const rows = await db.product.groupBy({
      by: ["brandId"],
      where: { categoryId: { in: categoryIds }, status: "ACTIVE" },
      _count: { _all: true },
    });
    const ids = rows
      .map((r) => r.brandId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return [];

    const brands = await db.brand.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    });
    const counts = new Map(rows.map((r) => [r.brandId, r._count._all]));
    return brands.map((b) => ({
      slug: b.slug,
      name: b.name,
      count: counts.get(b.id) ?? 0,
    }));
  } catch (e) {
    console.error("category brands load error", e);
    return [];
  }
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  const params = await props.params;
  const category = await loadCategory(params.category);
  if (!category) {
    return { title: "Категория не найдена" };
  }
  return categoryMetadata(category);
}

function pickStr(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function CategoryPage(props: CategoryPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const category = await loadCategory(params.category);
  if (!category) notFound();

  const pageRaw = parseInt(pickStr(searchParams.page) ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const selectedBrand = pickStr(searchParams.brand);
  const selectedKind = pickStr(searchParams.kind);
  const selectedCondition = pickStr(searchParams.condition);

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const [products, brands] = await Promise.all([
    loadCategoryProducts({
      categoryIds,
      brandSlug: selectedBrand,
      kind: selectedKind,
      condition: selectedCondition,
      page,
    }),
    withTimeoutFallback(loadCategoryBrands(categoryIds), {
      fallback: [] as { slug: string; name: string; count: number }[],
      label: "category.brands",
      timeoutMs: 1200,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(products.total / PAGE_SIZE));
  const hasFilters = Boolean(selectedBrand || selectedKind || selectedCondition);
  // Панель фильтров не нужна, когда фильтровать нечего: одна кнопка «сбросить»
  // над сеткой из двух карточек выглядит как поломка, а не как инструмент.
  const showFilters = brands.length > 1 || products.total > PAGE_SIZE || hasFilters;

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/catalog", label: "Каталог" },
          ...(category.parent
            ? [
                {
                  href: `/catalog/${category.parent.slug}`,
                  label: category.parent.name,
                },
              ]
            : []),
          { label: category.name },
        ]}
      />

      <section className="rails container pb-16">
        <div className="max-w-3xl">
          <SectionTag>
            {category.parent ? category.parent.name : "Каталог оборудования"}
          </SectionTag>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {category.description}
            </p>
          ) : null}
        </div>

        {category.children.length > 0 ? (
          <div className="mt-10">
            <h2 className="tech-label text-muted-foreground">Подкатегории</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.children.map((child) => (
                <CategoryCard
                  key={child.id}
                  category={child}
                  href={`/catalog/${child.slug}`}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div
          className={
            showFilters
              ? "mt-10 grid items-start gap-8 lg:grid-cols-[260px_1fr]"
              : "mt-10"
          }
        >
          {showFilters ? (
            <CatalogFilters
              categories={[]}
              brands={brands}
              selectedBrand={selectedBrand}
              selectedKind={selectedKind}
              selectedCondition={selectedCondition}
              showCategories={false}
            />
          ) : null}

          <div>
            {products.items.length > 0 ? (
              <>
                <p className="tech-label text-muted-foreground">
                  Показано {products.items.length} из {products.total} товаров
                </p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                <CatalogPagination
                  page={page}
                  totalPages={totalPages}
                  basePath={`/catalog/${category.slug}`}
                  searchParams={searchParams}
                />

                {/* Раньше страница обрывалась сеткой: единственным выходом
                    оставалась кнопка в шапке. */}
                <div className="mt-10 rounded-lg border border-border bg-surface/60 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
                  <div className="max-w-xl">
                    <h2 className="text-base font-semibold tracking-tight text-foreground">
                      Не нашли нужную позицию?
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      В каталоге опубликована часть номенклатуры. Пришлите
                      модель или техническое задание — подберём под задачу и
                      пришлём КП со сроком поставки.
                    </p>
                  </div>
                  <div className="mt-4 shrink-0 sm:mt-0">
                    <QuoteRequestDialog
                      source={`category:${category.slug}`}
                      triggerLabel="Получить КП"
                      triggerVariant="accent"
                    />
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title={
                  hasFilters
                    ? "По выбранным фильтрам позиций нет"
                    : "В этой категории пока нет опубликованных позиций"
                }
                description="Напишите, какое оборудование нужно, — подберём под задачу или предложим аналог из смежных разделов."
                quoteCta={{
                  label: "Получить КП",
                  source: `category-empty:${category.slug}`,
                }}
                secondaryCta={{ label: "Весь каталог", href: "/catalog" }}
              />
            )}
          </div>
        </div>
      </section>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Каталог", url: "/catalog" },
          ...(category.parent
            ? [
                {
                  name: category.parent.name,
                  url: `/catalog/${category.parent.slug}`,
                },
              ]
            : []),
          { name: category.name, url: `/catalog/${category.slug}` },
        ])}
      />
    </>
  );
}
