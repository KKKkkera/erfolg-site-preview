import { db, isDatabaseConfigured } from "@/lib/db";
import {
  getStaticCmsPage,
  isPlaceholderCmsContent,
} from "@/lib/static-cms-pages";
import { siteConfig } from "@/lib/site-config";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export type CmsPage = {
  slug: string;
  title: string;
  content: string;
  seoTitle: string | null;
  seoDesc: string | null;
};

/**
 * Загружает CMS-страницу из БД. Возвращает null, если БД недоступна,
 * страница не найдена или не опубликована.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
const cmsCache = new Map<string, { value: CmsPage | null; expiresAt: number }>();
const cmsInFlight = new Map<string, Promise<CmsPage | null>>();

/**
 * Сбрасывает кэш после правки страницы в админке.
 *
 * Без этого revalidatePath бесполезен: маршрут пересобирается, но
 * getCmsPage отдаёт тот же протухший объект из памяти, и менеджер до пяти
 * минут видит на сайте старый текст, хотя админка отрапортовала «сохранено».
 * Вызывать ДО revalidatePath.
 */
export function invalidateCmsCache(slug?: string): void {
  if (slug) {
    cmsCache.delete(slug);
    cmsInFlight.delete(slug);
    return;
  }
  cmsCache.clear();
  cmsInFlight.clear();
}

const LEGACY_DOMAIN = "erfolg.ru";
const CANONICAL_DOMAIN = (() => {
  try {
    return new URL(siteConfig.url).hostname;
  } catch {
    return "erfolgmt.ru";
  }
})();

function normalizeLegacyDomain(value: string | null): string | null {
  if (!value || !value.includes(LEGACY_DOMAIN)) return value;
  return value.replaceAll(LEGACY_DOMAIN, CANONICAL_DOMAIN);
}

function normalizeCmsPage(page: CmsPage): CmsPage {
  return {
    ...page,
    title: normalizeLegacyDomain(page.title) ?? page.title,
    content: normalizeLegacyDomain(page.content) ?? page.content,
    seoTitle: normalizeLegacyDomain(page.seoTitle),
    seoDesc: normalizeLegacyDomain(page.seoDesc),
  };
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  const cached = cmsCache.get(slug);
  if (cached && cached.expiresAt >= Date.now()) {
    return cached.value;
  }

  // Статика ПЕРЕКРЫВАЕТ базу сознательно: юридические тексты подстраиваются
  // под режим сайта (FORMS_DISABLED меняет формулировки политик), а снимок в
  // БД этого делать не умеет. Следствие: правки этих slug'ов в /admin/pages
  // на сайт не попадают — форма редактирования предупреждает об этом
  // (см. CODE_MANAGED_CMS_SLUGS в src/lib/public-routes.ts).
  const staticPage = getStaticCmsPage(slug);
  if (staticPage) {
    const normalizedStaticPage = normalizeCmsPage(staticPage);
    cmsCache.set(slug, { value: normalizedStaticPage, expiresAt: Date.now() + CACHE_TTL_MS });
    return normalizedStaticPage;
  }

  if (!isDatabaseConfigured) {
    return null;
  }

  const existingPromise = cmsInFlight.get(slug);
  if (existingPromise) {
    return existingPromise;
  }

  const loadPromise = (async () => {
  try {
      const page = await withTimeoutFallback(
        db.page.findUnique({ where: { slug } }),
        {
          fallback: null,
          label: `cms.${slug}`,
          timeoutMs: 1000,
        },
      );
      if (!page || !page.isPublished) {
        const fallback = getStaticCmsPage(slug);
        if (fallback) {
          const normalizedFallback = normalizeCmsPage(fallback);
          cmsCache.set(slug, {
            value: normalizedFallback,
            expiresAt: Date.now() + CACHE_TTL_MS,
          });
          return normalizedFallback;
        }
        return fallback;
      }

      const result: CmsPage = {
        slug: page.slug,
        title: page.title,
        content: page.content,
        seoTitle: page.seoTitle,
        seoDesc: page.seoDesc,
      };
      const normalizedResult = normalizeCmsPage(result);
      const normalizedStaticPage = staticPage ? normalizeCmsPage(staticPage) : null;
      const normalized = isPlaceholderCmsContent(normalizedResult.content)
        ? normalizedStaticPage ?? normalizedResult
        : normalizedResult;

      cmsCache.set(slug, { value: normalized, expiresAt: Date.now() + CACHE_TTL_MS });
      return normalized;
    } catch (e) {
      console.error(`getCmsPage(${slug}) error`, e);
      const fallback = getStaticCmsPage(slug);
      if (fallback) {
        const normalizedFallback = normalizeCmsPage(fallback);
        cmsCache.set(slug, {
          value: normalizedFallback,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return normalizedFallback;
      }
      return fallback;
    } finally {
      cmsInFlight.delete(slug);
    }
  })();

  cmsInFlight.set(slug, loadPromise);
  return loadPromise;
}
