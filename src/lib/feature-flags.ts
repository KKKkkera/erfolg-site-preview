/**
 * Maintenance-mode gate (152-ФЗ).
 *
 * Когда NEXT_PUBLIC_FORMS_DISABLED="true":
 *   - все публичные формы (заявка, КП, сервис, контакт) отключены в UI;
 *   - server actions отклоняют отправку независимо от UI;
 *   - cookie-баннер и Яндекс.Метрика не подгружаются (никаких ПДн).
 *
 * Включается, пока запись в реестре операторов ПДн не подтверждена.
 * Снять можно только после получения регистрационного номера РКН и
 * заполнения юр-блока в siteConfig.legal + ответственного в политике.
 */
export const FORMS_DISABLED =
  process.env.NEXT_PUBLIC_FORMS_DISABLED === "true";

/**
 * SEO-indexing gate (раздельно от форм).
 *
 * Когда NEXT_PUBLIC_SEO_BLOCK_INDEX="true":
 *   - robots.txt отдаёт Disallow: /
 *   - все страницы получают <meta robots="noindex,nofollow,nocache">.
 *
 * Используется на dev/staging, и пока сайт не готов к индексации.
 * Должен быть "false" перед запуском, даже если FORMS_DISABLED="true",
 * иначе при снятии maintenance индексация всё ещё будет закрыта.
 */
export const SEO_BLOCK_INDEX =
  process.env.NEXT_PUBLIC_SEO_BLOCK_INDEX === "true" || FORMS_DISABLED;

export const MAINTENANCE_CONTACT = {
  phone: "+7 928 895 70 70",
  phoneHref: "tel:+79288957070",
  email: "info@erfolgmt.ru",
  emailHref: "mailto:info@erfolgmt.ru",
} as const;
