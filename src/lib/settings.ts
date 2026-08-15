import { db, isDatabaseConfigured } from "@/lib/db";

// Простой in-memory кэш на процесс. Будет очищаться при изменении настроек
// в админке (этап 6) через clearSettingsCache(). Для prod достаточно — записей <100,
// чтения часты, инвалидация редкая.
const UNDEFINED = Symbol("settings.undefined");
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: unknown; expiresAt: number }>();
const inFlight = new Map<string, Promise<unknown>>();

function cacheKeyForSetting(key: string) {
  return `setting:${key}`;
}

function cacheKeyForPrefix(prefix: string) {
  return `prefix:${prefix}`;
}

function readCache<T>(key: string): T | typeof UNDEFINED | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T | typeof UNDEFINED;
}

function writeCache(key: string, value: unknown) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export async function getSetting<T = unknown>(
  key: string,
  fallback?: T,
): Promise<T | undefined> {
  const cacheKey = cacheKeyForSetting(key);
  const cached = readCache<T>(cacheKey);
  if (cached !== undefined) {
    return cached === UNDEFINED ? undefined : (cached as T);
  }

  if (!isDatabaseConfigured) {
    writeCache(cacheKey, fallback === undefined ? UNDEFINED : fallback);
    return fallback;
  }

  const existingPromise = inFlight.get(cacheKey);
  if (existingPromise) {
    return (await existingPromise) as T | undefined;
  }

  const promise = db.setting
    .findUnique({ where: { key } })
    .catch(() => null)
    .then((row) => {
      const value = (row?.value as T | undefined) ?? fallback;
      writeCache(cacheKey, value === undefined ? UNDEFINED : value);
      return value;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, promise);
  return (await promise) as T | undefined;
}

export async function getSettings<T extends Record<string, unknown>>(
  prefix: string,
): Promise<T> {
  const cacheKey = cacheKeyForPrefix(prefix);
  const cached = readCache<T>(cacheKey);
  if (cached !== undefined && cached !== UNDEFINED) {
    return cached as T;
  }

  if (!isDatabaseConfigured) {
    const empty = {} as T;
    writeCache(cacheKey, empty);
    return empty;
  }

  const existingPromise = inFlight.get(cacheKey);
  if (existingPromise) {
    return (await existingPromise) as T;
  }

  const promise = db.setting
    .findMany({ where: { key: { startsWith: prefix } } })
    .catch(() => [])
    .then((rows) => {
      const result: Record<string, unknown> = {};
      for (const r of rows) {
        // "company.inn" with prefix "company" → "inn"
        const tail = r.key.startsWith(`${prefix}.`)
          ? r.key.slice(prefix.length + 1)
          : r.key.slice(prefix.length);
        result[tail] = r.value;
      }
      writeCache(cacheKey, result);
      return result as T;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, promise);
  return (await promise) as T;
}

export function clearSettingsCache(key?: string) {
  if (!key) {
    cache.clear();
    inFlight.clear();
    return;
  }

  cache.delete(cacheKeyForSetting(key));
  cache.delete(cacheKeyForPrefix(key));
  inFlight.delete(cacheKeyForSetting(key));
  inFlight.delete(cacheKeyForPrefix(key));

  for (const cacheKey of cache.keys()) {
    if (
      cacheKey === cacheKeyForSetting(key) ||
      cacheKey === cacheKeyForPrefix(key) ||
      cacheKey.startsWith(`${cacheKeyForPrefix(key)}.`) ||
      cacheKey.startsWith(`${cacheKeyForSetting(key)}.`)
    ) {
      cache.delete(cacheKey);
    }
  }
}
