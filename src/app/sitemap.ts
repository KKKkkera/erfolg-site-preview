import type { MetadataRoute } from "next";

import { getCatalogSlugs, getCategorySlugs } from "@/lib/sitemap-data";
import { db, isDatabaseConfigured } from "@/lib/db";

// Генерировать на запросе, а не на билде. Иначе Next пререндерит sitemap
// в Docker-сборке, где БД недоступна, все три try/catch молча падают,
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
  { path: "/44-fz", priority: 0.7, changeFrequency: "monthly" },
  { path: "/223-fz", priority: 0.7, changeFrequency: "monthly" },
  { path: "/service", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contacts", priority: 0.7, changeFrequency: "monthly" },
  { path: "/reviews", priority: 0.6, changeFrequency: "monthly" },
  { path: "/delivery", priority: 0.5, changeFrequency: "monthly" },
  { path: "/warranty", priority: 0.5, changeFrequency: "monthly" },
  { path: "/licenses", priority: 0.5, changeFrequency: "monthly" },
];

const REGIONAL_CITIES = [
  "grozny",
  "vladikavkaz",
  "makhachkala",
  "nazran",
  "nalchik",
  "stavropol",
  "cherkessk",
  "rostov",
  "krasnodar",
  "voronezh",
];

const LEGAL_ROUTES: StaticEntry[] = [
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/personal-data-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookie-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/consent", priority: 0.3, changeFrequency: "yearly" },
  { path: "/review-consent", priority: 0.3, changeFrequency: "yearly" },
];

function abs(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

// Хардкодим дату последней правки статических маршрутов. Каждый раз когда
// меняется их контент — обновляем эту константу. Бот видит стабильный
// timestamp и не считает, что мы трогаем сайт каждую секунду.
const STATIC_LAST_MODIFIED = new Date("2026-08-12T00:00:00Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const r of STATIC_ROUTES) {
    entries.push({
      url: abs(r.path),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    });
  }

  // Категории
  try {
    const categories = await getCategorySlugs();
    for (const c of categories) {
      entries.push({
        url: abs(`/catalog/${c.slug}`),
        lastModified: c.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (e) {
    console.error("sitemap/categories error", e);
  }

  // Товары
  try {
    const products = await getCatalogSlugs();
    for (const p of products) {
      entries.push({
        url: abs(`/catalog/${p.categorySlug}/${p.productSlug}`),
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
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    });
  }

  // Региональные посадочные
  for (const city of REGIONAL_CITIES) {
    entries.push({
      url: abs(`/postavka/${city}`),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.6,
    });
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
