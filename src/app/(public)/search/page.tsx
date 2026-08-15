import type { Metadata } from "next";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";

import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { ProductCard } from "@/components/public/product-card";
import { EmptyState } from "@/components/public/empty-state";
import { QuoteRequestDialog } from "@/components/public/quote-request-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Поиск по каталогу",
  description:
    "Поиск по каталогу ООО «Эрфольг»: медицинское оборудование, расходные материалы, запчасти. Поиск по названию, артикулу, модели или краткому описанию товара.",
  robots: { index: false, follow: true },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

async function runSearch(q: string) {
  try {
    return await db.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
          { shortDesc: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        brand: true,
        category: true,
        images: { take: 1, orderBy: { sort: "asc" } },
      },
      take: 50,
      orderBy: { updatedAt: "desc" },
    });
  } catch (e) {
    console.error("search/runSearch error", e);
    return [];
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const isShort = q.length < 2;

  const results = isShort ? [] : await runSearch(q);

  return (
    <>
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "Поиск" }]}
      />

      <section className="rails container pb-16">
        <div className="max-w-3xl">
          <SectionTag>Каталог</SectionTag>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            Поиск по каталогу
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Поиск выполняется по названию, модели, артикулу и описанию активных
            позиций каталога. Минимальная длина запроса — 2 символа.
          </p>

          <form
            method="GET"
            action="/search"
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            role="search"
          >
            <label htmlFor="q" className="sr-only">
              Поисковый запрос
            </label>
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Например: ИВЛ, монитор, центрифуга"
                className="h-12 pl-10"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg">
              Найти
            </Button>
          </form>

          {!isShort ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {results.length >= 50
                ? "Показаны первые 50 позиций по запросу «"
                : results.length > 0
                  ? `Найдено ${results.length} позиций по запросу «`
                  : "По запросу «"}
              <span className="font-medium text-foreground">{q}</span>
              {results.length >= 50
                ? "» — уточните формулировку."
                : results.length > 0
                  ? "»."
                  : "» позиций не найдено."}
            </p>
          ) : null}
        </div>

        {isShort ? (
          <div className="mt-10">
            <EmptyState
              icon={Search}
              title="Введите поисковый запрос"
              description="Минимум 2 символа. Например: модель оборудования, артикул, бренд или часть описания товара."
              cta={{ label: "Перейти в каталог", href: "/catalog" }}
            />
          </div>
        ) : results.length > 0 ? (
          <>
            {/* sr-only h2: иначе после h1 сразу шли h3 из карточек товаров */}
            <h2 className="sr-only">Результаты поиска</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-10">
            <EmptyState
              icon={Search}
              title="По запросу ничего не найдено"
              description="Уточните формулировку или отправьте запрос на подбор — менеджер подберёт оборудование под задачу и подготовит КП."
              secondaryCta={{ label: "В каталог", href: "/catalog" }}
            />
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <QuoteRequestDialog
                source="search-empty"
                triggerLabel="Получить КП"
                triggerVariant="accent"
                triggerSize="lg"
              />
              <Button asChild variant="link">
                <Link href="/contacts">
                  Связаться с менеджером
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
