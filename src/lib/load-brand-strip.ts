import { db } from "@/lib/db";
import { BRAND_CATALOG } from "@/lib/brand-catalog";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";
import type { BrandStripItem } from "@/components/public/brand-strip";

/* Загрузка ленты брендов. Вынесено из главной, потому что тот же список
   теперь вставляется блоком [[block:brands]] в произвольную страницу. */
export async function loadBrandStrip(): Promise<BrandStripItem[]> {
  /* productCount: 0 — плитка остаётся некликабельной. Без базы посчитать
     наполнение нельзя, а вести из ленты в заведомо пустую выдачу нельзя тем
     более, поэтому запасной список только показывает логотипы. */
  const fallback = BRAND_CATALOG.map(({ slug, name, logo }) => ({
    slug,
    name,
    logo: logo ?? null,
    productCount: 0,
  }));

  try {
    const rows = await withTimeoutFallback(
      db.brand.findMany({
        where: { slug: { in: BRAND_CATALOG.map((brand) => brand.slug) } },
        orderBy: [{ sort: "asc" }, { name: "asc" }],
        select: {
          slug: true,
          name: true,
          logo: true,
          _count: { select: { products: { where: { status: "ACTIVE" } } } },
        },
      }),
      { fallback: null, label: "home.brands", timeoutMs: 500 },
    );

    if (!rows) return fallback;

    return rows.map((brand) => ({
      slug: brand.slug,
      name: brand.name,
      logo: brand.logo,
      productCount: brand._count.products,
    }));
  } catch {
    return fallback;
  }
}
