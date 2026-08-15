/**
 * Заготовки данных для sitemap.ts (этап 7).
 * Все функции с try/catch — БД может быть пустой/недоступной.
 */
import { db, isDatabaseConfigured } from "@/lib/db";

export type CatalogSlugEntry = {
  categorySlug: string;
  productSlug: string;
  updatedAt: Date;
};

export type SlugEntry = {
  slug: string;
  updatedAt: Date;
};

/**
 * Активные товары каталога: пары categorySlug/productSlug + updatedAt.
 * Используется для построения /catalog/[category]/[product] в sitemap.xml.
 */
export async function getCatalogSlugs(): Promise<CatalogSlugEntry[]> {
  if (!isDatabaseConfigured) {
    return [];
  }
  try {
    const products = await db.product.findMany({
      where: { status: "ACTIVE" },
      select: {
        slug: true,
        updatedAt: true,
        category: { select: { slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return products
      .filter((p) => p.category?.slug)
      .map((p) => ({
        categorySlug: p.category!.slug,
        productSlug: p.slug,
        updatedAt: p.updatedAt,
      }));
  } catch (e) {
    console.error("sitemap/getCatalogSlugs error", e);
    return [];
  }
}

/**
 * Все категории каталога (корневые И подкатегории) + updatedAt.
 * Для построения /catalog/[category] в sitemap.xml.
 *
 * Подкатегории обязаны быть в sitemap: канонические URL товаров лежат именно
 * под ними (/catalog/ventilators/...), и страница /catalog/ventilators — такой
 * же реальный маршрут, как корневой раздел. Раньше брались только корневые.
 */
export async function getCategorySlugs(): Promise<SlugEntry[]> {
  if (!isDatabaseConfigured) {
    return [];
  }
  try {
    const categories = await db.category.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { sort: "asc" },
    });
    return categories.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt }));
  } catch (e) {
    console.error("sitemap/getCategorySlugs error", e);
    return [];
  }
}
