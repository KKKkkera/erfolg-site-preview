/**
 * Регистрационное удостоверение Росздравнадзора (РУ).
 *
 * В карточках товаров встречается текст-заглушка вместо номера («На уточнении»
 * из сидов). Для публикации это хуже пустого поля: на странице появляется блок
 * «Регистрационное удостоверение Росздравнадзора № На уточнении» и такой же
 * additionalProperty в JSON-LD — то есть сайт как бы утверждает наличие РУ,
 * не называя его. Поэтому заглушки считаем отсутствием номера.
 *
 * Формат самих номеров не проверяем: у Росздравнадзора сосуществуют РЗН
 * 2014/1234, ФСЗ 2012/12345, ФСР 2010/07351 и старые серии — регулярка тут
 * отсекла бы валидные значения.
 */
const PLACEHOLDER_PATTERNS = [
  /^на уточнени/i,
  /^уточня/i,
  /^уточнить/i,
  /^требует/i,
  /^нет данных/i,
  /^не указан/i,
  /^отсутств/i,
  /^[-—–?.]+$/,
];

export function isPlaceholderRegNumber(value: string | null | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed === "") return true;
  if (trimmed.includes("[")) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/** Номер РУ пригоден к публикации: заполнен и не является заглушкой. */
export function hasRealRegNumber(value: string | null | undefined): boolean {
  return !isPlaceholderRegNumber(value);
}
