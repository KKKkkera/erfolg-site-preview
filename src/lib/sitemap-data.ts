/**
 * Заготовки данных для sitemap.ts (этап 7).
 * Все функции с try/catch — БД может быть пустой/недоступной.
 */
import { db, isDatabaseConfigured } from "@/lib/db";

export type CatalogSlugEntry = {
  productSlug: string;
  updatedAt: Date;
};

export type SlugEntry = {
  slug: string;
  updatedAt: Date;
};

/**
 * Активные товары каталога: slug + updatedAt.
 * Используется для построения /catalog/[product] в sitemap.xml.
 */
export async function getCatalogSlugs(): Promise<CatalogSlugEntry[]> {
  if (!isDatabaseConfigured) {
    return [];
  }
  try {
    const products = await db.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return products.map((p) => ({
      productSlug: p.slug,
      updatedAt: p.updatedAt,
    }));
  } catch (e) {
    console.error("sitemap/getCatalogSlugs error", e);
    return [];
  }
}
