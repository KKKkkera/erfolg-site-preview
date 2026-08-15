/**
 * CMS-slug'и, у которых есть реальный маршрут в src/app/(public)/<slug>/page.tsx.
 *
 * Динамического маршрута-рендерера для произвольных страниц из админки НЕТ:
 * страница с любым другим slug сохранится в БД, но по адресу /<slug> будет 404.
 * Этот список — единая точка правды для sitemap, IndexNow-пингов и
 * предупреждения в форме редактирования страниц. Добавляя новый статичный
 * маршрут под CMS-страницу — допишите slug сюда.
 */
export const CMS_SLUGS_WITH_ROUTES = new Set<string>([
  "about",
  "delivery",
  "warranty",
  "licenses",
  "privacy",
  "personal-data-policy",
  "cookie-policy",
  "consent",
  "review-consent",
  "terms",
]);

export function hasPublicCmsRoute(slug: string): boolean {
  return CMS_SLUGS_WITH_ROUTES.has(slug);
}

/**
 * Slug'и, чей контент управляется КОДОМ: getCmsPage() в src/lib/cms.ts
 * возвращает текст из src/lib/static-cms-pages.ts, НЕ обращаясь к БД
 * (юридические тексты предоставлены заказчиком и размещаются буквально —
 * снимок в базе увёл бы их из-под контроля версий). Правки таких страниц в
 * админке на сайт не попадают — форма редактирования показывает
 * предупреждение.
 *
 * Держать в синхроне с ключами staticPages в static-cms-pages.ts.
 * (Список продублирован сознательно: импорт самого модуля тянул бы весь
 * HTML юридических текстов в клиентский бандл админки.)
 */
export const CODE_MANAGED_CMS_SLUGS = new Set<string>([
  "about",
  "licenses",
  "privacy",
  "personal-data-policy",
  "cookie-policy",
  "consent",
  "terms",
]);

export function isCodeManagedCmsSlug(slug: string): boolean {
  return CODE_MANAGED_CMS_SLUGS.has(slug);
}
