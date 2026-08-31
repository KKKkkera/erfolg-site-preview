import { db, isDatabaseConfigured } from "@/lib/db";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";
import { RUSSIA_REGIONS, type RussiaRegion } from "@/components/public/russia-map-regions";

/* Тексты страниц регионов.

   Список регионов остаётся в коде (russia-map-regions.ts — он сгенерирован
   вместе с контурами карты). В базе лежит только редактируемая часть, и
   только для тех регионов, которые реально открывали в админке: 86 пустых
   строк-дублей заводить незачем. Регион без записи показывает дефолтный
   текст, общий для всех. */

export type RegionContent = {
  slug: string;
  heading: string | null;
  intro: string | null;
  content: string;
  seoTitle: string | null;
  seoDesc: string | null;
  isPublished: boolean;
};

export const REGIONS_BY_SLUG = new Map<string, RussiaRegion>(
  RUSSIA_REGIONS.map((region) => [region.slug, region]),
);

/** Дефолтный вводный текст — тот же, что стоял в JSX до переноса в админку. */
export function defaultRegionIntro(): string {
  return (
    "Поставляем медицинское оборудование и выезжаем на сервис по всему " +
    "региону. Пришлите ТЗ или спецификацию — подготовим предложение " +
    "со сроком и ценой"
  );
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: RegionContent | null; expiresAt: number }>();

/** Сброс кэша после правки в админке. Вызывать ДО revalidatePath. */
export function invalidateRegionCache(slug?: string): void {
  if (slug) {
    cache.delete(slug);
    return;
  }
  cache.clear();
}

export async function getRegionContent(
  slug: string,
): Promise<RegionContent | null> {
  const cached = cache.get(slug);
  if (cached && cached.expiresAt >= Date.now()) return cached.value;

  if (!isDatabaseConfigured) return null;

  try {
    const row = await withTimeoutFallback(
      db.regionPage.findUnique({ where: { slug } }),
      { fallback: null, label: `region.${slug}`, timeoutMs: 1000 },
    );
    const value: RegionContent | null =
      row && row.isPublished
        ? {
            slug: row.slug,
            heading: row.heading,
            intro: row.intro,
            content: row.content,
            seoTitle: row.seoTitle,
            seoDesc: row.seoDesc,
            isPublished: row.isPublished,
          }
        : null;
    cache.set(slug, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  } catch (e) {
    console.error("getRegionContent error", e);
    return null;
  }
}

/** Список для админки: все 86 регионов + признак «есть запись в БД». */
export async function listRegionsWithStatus(): Promise<
  Array<{
    slug: string;
    name: string;
    code: string;
    id: string | null;
    isPublished: boolean;
    updatedAt: Date | null;
  }>
> {
  let rows: Array<{
    id: string;
    slug: string;
    isPublished: boolean;
    updatedAt: Date;
  }> = [];
  try {
    rows = await db.regionPage.findMany({
      select: { id: true, slug: true, isPublished: true, updatedAt: true },
    });
  } catch (e) {
    console.error("listRegionsWithStatus error", e);
  }
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  return RUSSIA_REGIONS.map((region) => {
    const row = bySlug.get(region.slug);
    return {
      slug: region.slug,
      name: region.name,
      code: region.code,
      id: row?.id ?? null,
      isPublished: row?.isPublished ?? false,
      updatedAt: row?.updatedAt ?? null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "ru"));
}
