/**
 * Разделы и бренды каталога для посадочных страниц
 * /catalog/category/[slug] и /catalog/brand/[slug].
 *
 * Здесь же живёт правило «показываем только непустое»: раздел или бренд без
 * активных товаров ведёт в пустую выдачу, такие страницы в индекс не отдаём.
 */
import { db, isDatabaseConfigured } from "@/lib/db";

export type CategoryPageData = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  parent: { slug: string; name: string } | null;
};

export type TaxonomyLink = {
  slug: string;
  name: string;
  count: number;
};

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryPageData | null> {
  if (!isDatabaseConfigured) return null;

  try {
    const row = await db.category.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        image: true,
        seoTitle: true,
        seoDesc: true,
        parent: { select: { slug: true, name: true } },
      },
    });
    return row ?? null;
  } catch (e) {
    throw e;
  }
}

export async function getBrandBySlug(slug: string) {
  if (!isDatabaseConfigured) return null;

  try {
    const row = await db.brand.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        country: true,
        website: true,
        logo: true,
      },
    });
    return row ?? null;
  } catch (e) {
    throw e;
  }
}

/**
 * Счётчики активных товаров по категориям, включая товары подкатегорий:
 * товар лежит в «Аппараты ИВЛ», а показать его надо и в «Реанимации».
 */
async function countsByCategory(): Promise<{
  own: Map<string, number>;
  childrenOf: Map<string, string[]>;
  all: { id: string; slug: string; name: string; parentId: string | null }[];
}> {
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

  const own = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  const childrenOf = new Map<string, string[]>();
  for (const c of cats) {
    if (!c.parentId) continue;
    const list = childrenOf.get(c.parentId) ?? [];
    list.push(c.id);
    childrenOf.set(c.parentId, list);
  }

  return { own, childrenOf, all: cats };
}

function totalFor(
  id: string,
  own: Map<string, number>,
  childrenOf: Map<string, string[]>,
): number {
  const kids = (childrenOf.get(id) ?? []).reduce(
    (sum, childId) => sum + (own.get(childId) ?? 0),
    0,
  );
  return (own.get(id) ?? 0) + kids;
}

/**
 * Соседняя навигация для страницы раздела: подразделы, если они есть, иначе
 * соседи по родителю. Пустые не показываем — ссылка в пустую выдачу тратит
 * и краулинговый бюджет, и внимание посетителя.
 */
export async function getCategorySiblings(
  category: CategoryPageData,
): Promise<TaxonomyLink[]> {
  if (!isDatabaseConfigured) return [];

  try {
    const { own, childrenOf, all } = await countsByCategory();

    const childIds = childrenOf.get(category.id) ?? [];
    const pool =
      childIds.length > 0
        ? all.filter((c) => childIds.includes(c.id))
        : all.filter(
            (c) => c.parentId === null && c.id !== category.id,
          );

    return pool
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        count: totalFor(c.id, own, childrenOf),
      }))
      .filter((c) => c.count > 0);
  } catch (e) {
    console.error("getCategorySiblings error", e);
    return [];
  }
}

/** Разделы с товарами — для sitemap и перелинковки. */
export async function getIndexableCategories(): Promise<TaxonomyLink[]> {
  if (!isDatabaseConfigured) return [];

  try {
    const { own, childrenOf, all } = await countsByCategory();
    return all
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        count: totalFor(c.id, own, childrenOf),
      }))
      .filter((c) => c.count > 0);
  } catch (e) {
    console.error("getIndexableCategories error", e);
    return [];
  }
}

/** Бренды с активными товарами — для sitemap и перелинковки. */
export async function getIndexableBrands(): Promise<TaxonomyLink[]> {
  if (!isDatabaseConfigured) return [];

  try {
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

    // brandId у товара nullable — строки без бренда в счётчиках отбрасываем.
    const byBrandId = new Map(
      counts
        .filter((b): b is typeof b & { brandId: string } => b.brandId !== null)
        .map((b) => [b.brandId, b._count._all]),
    );
    return brands
      .map((b) => ({
        slug: b.slug,
        name: b.name,
        count: byBrandId.get(b.id) ?? 0,
      }))
      .filter((b) => b.count > 0);
  } catch (e) {
    console.error("getIndexableBrands error", e);
    return [];
  }
}
