/**
 * Утилиты форматирования: телефон в человеческий вид, даты по-русски.
 */

const dateFormatterRu = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/**
 * Форматирует строку с цифрами и + в человекочитаемый российский телефон.
 * Поддерживает формы +7XXXXXXXXXX и 8XXXXXXXXXX. Если не распознан — возвращает исходник.
 */
// Телефон в заявках необязателен (обязателен email), поэтому принимаем null
// и показываем прочерк вместо пустой ячейки в админке.
export function formatPhone(input: string | null | undefined): string {
  if (!input) return "—";
  const digits = input.replace(/[^\d+]/g, "");
  // нормализуем 8XXXXXXXXXX → +7XXXXXXXXXX
  let normalized = digits;
  if (normalized.startsWith("8") && normalized.length === 11) {
    normalized = "+7" + normalized.slice(1);
  } else if (!normalized.startsWith("+") && normalized.length === 11) {
    normalized = "+" + normalized;
  }

  const m = normalized.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (m) {
    return `+7 (${m[1]}) ${m[2]}-${m[3]}-${m[4]}`;
  }
  return input;
}

/**
 * Дата в формате "1 мая 2026 г." (Intl ru-RU).
 */
export function formatRu(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return dateFormatterRu.format(d);
}

/**
 * Превращает строку телефона в href для tel: (только цифры и плюс).
 */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
