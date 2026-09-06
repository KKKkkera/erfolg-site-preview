/**
 * Выборка товаров каталога — общая для /catalog, /catalog/category/[slug]
 * и /catalog/brand/[slug].
 *
 * Вынесено из страницы каталога: посадочные страницы категорий и брендов
 * показывают ту же выдачу под своим заголовком, и две копии условий where
 * (особенно правила «товар лежит в подкатегории») разошлись бы при первой же
 * правке фильтров.
 */
import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";

export const PAGE_SIZE = 24;

export type CatalogFilter = {
  categorySlugs?: string[];
  brandSlug?: string;
  kind?: string;
  condition?: string;
  query?: string;
  page: number;
};

export function buildProductWhere(
  filter: Omit<CatalogFilter, "page">,
): Prisma.ProductWhereInput {
  const { categorySlugs = [], brandSlug, kind, condition, query } = filter;

  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };

  if (query && query.length >= 2) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      { model: { contains: query, mode: "insensitive" } },
      { shortDesc: { contains: query, mode: "insensitive" } },
    ];
  }

  if (categorySlugs.length > 0) {
    // В фильтре стоят категории верхнего уровня, а товары лежат в подкатегориях
    // («Реанимация» → «Аппараты ИВЛ»). Совпадение по точному slug давало пустую
    // выдачу по всем разделам, где нет товаров, лежащих в корне напрямую.
    where.category = {
      OR: [
        { slug: { in: categorySlugs } },
        { parent: { slug: { in: categorySlugs } } },
      ],
    };
  }

  if (brandSlug) {
    where.brand = { slug: brandSlug };
  }

  if (kind === "EQUIPMENT" || kind === "CONSUMABLE" || kind === "SPARE_PART") {
    where.kind = kind;
  }

  if (condition === "used") where.isUsed = true;
  else if (condition === "new") where.isUsed = false;

  return where;
}

export function parseCatalogPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return 1;
  if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw))) notFound();
  return Number(raw);
}

export function loadCatalogProducts(filter: CatalogFilter) {
  const { page, ...rest } = filter;
  return queryCatalog(JSON.stringify(buildProductWhere(rest)), page);
}

const queryCatalog = cache(async (whereJson: string, page: number) => {
  const where: Prisma.ProductWhereInput = JSON.parse(whereJson);
  const total = await db.product.count({ where });
  if (!Number.isSafeInteger(page) || page < 1 || page > Math.max(1, Math.ceil(total / PAGE_SIZE))) notFound();
  const items = await db.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        images: { take: 1, orderBy: { sort: "asc" } },
      },
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    });

  return { items, total };
});

export type CatalogProducts = Awaited<ReturnType<typeof loadCatalogProducts>>;

/** Склонение слова «товар» под число — подпись «Найдено N …». */
export function productCountWord(count: number): string {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "товаров";
  const last = count % 10;
  if (last === 1) return "товар";
  if (last >= 2 && last <= 4) return "товара";
  return "товаров";
}
