import type { MetadataRoute } from "next";

import { getCatalogSlugs } from "@/lib/sitemap-data";
import {
  getIndexableBrands,
  getIndexableCategories,
} from "@/lib/catalog-taxonomy";
import { getIndexableRegionSlugs } from "@/lib/region-pages";
import { DELIVERY_CITIES } from "@/lib/delivery-cities";
import { db, isDatabaseConfigured } from "@/lib/db";

// Генерировать на запросе, а не на билде. Иначе Next пререндерит sitemap
// на этапе сборки, где БД недоступна, все три try/catch молча падают,
// и в прод уезжает карта только из статических маршрутов — без единой
// категории, товара и статьи (было ровно 26 URL вместо ~70).
export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://erfolgmt.ru";

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

type StaticEntry = {
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
};

const STATIC_ROUTES: StaticEntry[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/catalog", priority: 0.9, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/service", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contacts", priority: 0.7, changeFrequency: "monthly" },
  { path: "/reviews", priority: 0.6, changeFrequency: "monthly" },
  { path: "/works", priority: 0.6, changeFrequency: "monthly" },
  { path: "/regions", priority: 0.6, changeFrequency: "monthly" },
  { path: "/delivery", priority: 0.5, changeFrequency: "monthly" },
  { path: "/warranty", priority: 0.5, changeFrequency: "monthly" },
  { path: "/license", priority: 0.5, changeFrequency: "yearly" },
  { path: "/licenses", priority: 0.5, changeFrequency: "monthly" },
];

const LEGAL_ROUTES: StaticEntry[] = [
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/personal-data-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookie-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/consent", priority: 0.3, changeFrequency: "yearly" },
];

function abs(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const r of STATIC_ROUTES) {
    entries.push({
      url: abs(r.path),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    });
  }

  // Разделы каталога и производители. Только непустые: посадочная без товаров
  // ведёт в пустую выдачу, в индексе ей делать нечего.
  try {
    const [categories, brands] = await Promise.all([
      getIndexableCategories(),
      getIndexableBrands(),
    ]);

    for (const c of categories) {
      entries.push({
        url: abs(`/catalog/category/${c.slug}`),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const b of brands) {
      entries.push({
        url: abs(`/catalog/brand/${b.slug}`),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (e) {
    console.error("sitemap/taxonomy error", e);
  }

  // Товары
  try {
    const products = await getCatalogSlugs();
    for (const p of products) {
      entries.push({
        url: abs(`/catalog/${p.productSlug}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (e) {
    console.error("sitemap/products error", e);
  }

  // CMS-страницы из БД в sitemap НЕ добавляем: маршруты существуют только для
  // фиксированного набора slug'ов (см. src/lib/public-routes.ts), и все они уже
  // перечислены в STATIC_ROUTES/LEGAL_ROUTES выше. Страница, созданная в
  // админке с новым slug, не имеет рендерера — раньше она попадала сюда
  // и sitemap ссылался на 404.

  // Юр. страницы — статически
  for (const r of LEGAL_ROUTES) {
    entries.push({
      url: abs(r.path),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    });
  }

  // Городские посадочные. Список берём из delivery-cities.ts — того же файла,
  // из которого строятся сами маршруты: держать здесь копию слагов означало
  // забыть про неё при добавлении города.
  for (const city of DELIVERY_CITIES) {
    entries.push({
      url: abs(`/postavka/${city.slug}`),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Регионы — только с собственным текстом: страница на дефолтном абзаце
  // отдаёт noindex (см. regions/[slug]/page.tsx), и в карте сайта ей не место.
  try {
    const regions = await getIndexableRegionSlugs();
    for (const [slug, updatedAt] of regions) {
      entries.push({
        url: abs(`/regions/${slug}`),
        lastModified: updatedAt,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch (e) {
    console.error("sitemap/regions error", e);
  }

  // Статьи блога
  if (isDatabaseConfigured) {
    try {
      const posts = await db.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      });
      for (const p of posts) {
        entries.push({
          url: abs(`/blog/${p.slug}`),
          lastModified: p.updatedAt,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    } catch (e) {
      console.error("sitemap/blog error", e);
    }
  }

  return entries;
}
