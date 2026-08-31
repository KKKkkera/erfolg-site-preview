import { randomUUID } from "node:crypto";

/* Короткоживущее хранилище черновиков для предпросмотра.

   Черновик кладётся серверным экшеном и через несколько секунд читается
   страницей предпросмотра в новой вкладке. Держим в памяти процесса: это
   именно временный буфер на один переход, писать его в базу незачем.

   Почему не через URL: страница с десятком блоков легко перевалит лимит
   длины адреса, и черновик остался бы в истории браузера.

   Память не течёт: каждая запись живёт TTL_MS, просроченные подчищаются при
   каждом обращении, а размер ограничен MAX_ENTRIES. */

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 50;

type Entry = { content: string; leadSource: string; expiresAt: number };

const store = new Map<string, Entry>();

function sweep() {
  const now = Date.now();
  for (const [token, entry] of store) {
    if (entry.expiresAt <= now) store.delete(token);
  }
  // Аварийный предохранитель: если что-то пошло не так и записи копятся,
  // выкидываем самые старые, а не растём бесконечно.
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export function putPreview(content: string, leadSource: string): string {
  sweep();
  const token = randomUUID();
  store.set(token, { content, leadSource, expiresAt: Date.now() + TTL_MS });
  return token;
}

export function takePreview(
  token: string,
): { content: string; leadSource: string } | null {
  sweep();
  const entry = store.get(token);
  if (!entry) return null;
  return { content: entry.content, leadSource: entry.leadSource };
}
