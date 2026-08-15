/**
 * IndexNow — мгновенное уведомление поисковиков (Yandex/Bing) об изменениях.
 *
 * Заказчик должен:
 * 1. Сгенерировать ключ (например, на yandex.com/support/webmaster/indexnow)
 * 2. Положить ключ в env как INDEXNOW_KEY
 * 3. Создать файл public/<INDEXNOW_KEY>.txt с содержимым = самим ключом
 *
 * Если ключа нет — функция no-op и не падает.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://erfolgmt.ru";

const ENDPOINT = "https://api.indexnow.org/indexnow";

function abs(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function host(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "erfolgmt.ru";
  }
}

export async function pingIndexNow(urls: string[] | string): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return;

  const list = (Array.isArray(urls) ? urls : [urls]).map(abs);
  if (list.length === 0) return;

  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        host: host(),
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList: list,
      }),
      // не ждём долго — IndexNow обычно отвечает быстро
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    // Не блокируем основной поток. Логируем для аудита.
    console.error("indexnow ping error", e);
  }
}
