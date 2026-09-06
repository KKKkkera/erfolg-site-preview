import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { CatalogPagination } from "@/components/public/catalog-pagination";
import { EmptyState } from "@/components/public/empty-state";
import { ProductCard } from "@/components/public/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import {
  loadCatalogProducts,
  parseCatalogPage,
  productCountWord,
  PAGE_SIZE,
} from "@/lib/catalog-query";
import { getBrandBySlug, getIndexableBrands } from "@/lib/catalog-taxonomy";
import { breadcrumbListSchema, itemListSchema } from "@/lib/schema";
import { defaultMetadata } from "@/lib/seo";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

/* Посадочная страница производителя.

   Запрос вида «Nihon Kohden купить» — коммерческий и с понятным намерением, но
   до этой страницы ловить его было нечем: бренд существовал только как
   /catalog?brand=slug с canonical на /catalog. */

export const revalidate = 300;

type Params = { slug: string };
type SearchParams = Record<string, string | string[] | undefined>;

function pickPage(searchParams: SearchParams): number {
  return parseCatalogPage(searchParams.page);
}

export async function generateMetadata(props: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const [{ slug }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const brand = await getBrandBySlug(slug);
  if (!brand) {
    return defaultMetadata({
      title: "Производитель не найден",
      path: `/catalog/brand/${slug}`,
      noindex: true,
    });
  }

  const page = pickPage(searchParams);
  const products = await loadCatalogProducts({ brandSlug: slug, page });
  const suffix = page > 1 ? ` — страница ${page}` : "";
  const path =
    page > 1 ? `/catalog/brand/${slug}?page=${page}` : `/catalog/brand/${slug}`;

  return defaultMetadata({
    title: `${brand.name} — медицинское оборудование${suffix}`,
    description: `Оборудование ${brand.name}${brand.country ? ` (${brand.country})` : ""} — поставка по России от ООО «Эрфольг». Регистрационные удостоверения Росздравнадзора, сервис по лицензии ТОМИ, обучение персонала.`,
    path,
    noindex: products.total === 0,
  });
}

export default async function BrandPage(props: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const page = pickPage(searchParams);

  const [products, allBrands] = await Promise.all([
    loadCatalogProducts({ brandSlug: slug, page }),
    withTimeoutFallback(getIndexableBrands(), {
      fallback: [],
      label: `brand.${slug}.siblings`,
      timeoutMs: 1200,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(products.total / PAGE_SIZE));
  const otherBrands = allBrands.filter((b) => b.slug !== slug);

  return (
    <>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Каталог", url: "/catalog" },
          { name: brand.name, url: `/catalog/brand/${slug}` },
        ])}
      />
      {products.items.length > 0 ? (
        <JsonLd
          data={itemListSchema({
            name: `Оборудование ${brand.name}`,
            url: `/catalog/brand/${slug}`,
            items: products.items.map((p) => ({
              name: p.name,
              url: `/catalog/${p.slug}`,
              image: p.images[0]?.url ?? null,
            })),
          })}
        />
      ) : null}

      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/catalog", label: "Каталог" },
          { label: brand.name },
        ]}
      />

      <section className="rails container pb-16">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            {brand.name} — медицинское оборудование
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Поставляем оборудование {brand.name}
            {brand.country ? ` (${brand.country})` : ""} с действующими
            регистрационными удостоверениями Росздравнадзора. Монтаж,
            пуско-наладка и обучение персонала — силами наших инженеров, сервис
            по лицензии ТОМИ
          </p>
          {brand.website ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Сайт производителя:{" "}
              <a
                href={brand.website}
                rel="nofollow noopener noreferrer"
                target="_blank"
                className="text-flame-ink underline-offset-4 hover:underline"
              >
                {brand.website.replace(/^https?:\/\//, "")}
              </a>
            </p>
          ) : null}
        </div>

        <div className="mt-8">
          {products.items.length > 0 ? (
            <>
              <p className="tech-label text-muted-foreground">
                {products.total} {productCountWord(products.total)} в каталоге
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {products.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <CatalogPagination
                page={page}
                totalPages={totalPages}
                basePath={`/catalog/brand/${slug}`}
                searchParams={searchParams}
              />
            </>
          ) : (
            <EmptyState
              title="Позиций этого производителя сейчас нет"
              description={`Оборудование ${brand.name} поставляем под заказ. Пришлите модель или ТЗ — подберём аналог и пришлём КП.`}
              quoteCta={{ label: "Получить КП", source: `brand-${slug}` }}
            />
          )}
        </div>

        {otherBrands.length > 0 ? (
          <div className="mt-12 border-t border-border pt-8">
            <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
              Другие производители
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {otherBrands.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/catalog/brand/${item.slug}`}
                    className="inline-flex items-center gap-2 border border-border bg-white px-3.5 py-2 text-sm leading-6 text-foreground transition-colors hover:border-flame-ink hover:text-flame-ink"
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </>
  );
}
