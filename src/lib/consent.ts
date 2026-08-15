/**
 * Хранилище cookie-согласия (152-ФЗ) поверх localStorage.
 *
 * Единая точка для cookie-banner и Я.Метрики: чтение значения, запись выбора
 * и подписка на изменения (CustomEvent в своей вкладке + storage-событие для
 * синхронизации между вкладками). Компоненты читают состояние через
 * useSyncExternalStore с этими функциями.
 */

export const CONSENT_KEY = "cookie-consent";
export const CONSENT_DETAILS_KEY = "cookie-consent-details";
export const CONSENT_EVENT = "cookie-consent-changed";

export type ConsentDetails = { necessary: true; analytics: boolean };

export function readConsent(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function writeConsent(
  value: "accepted" | "rejected",
  details: ConsentDetails,
) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
    window.localStorage.setItem(CONSENT_DETAILS_KEY, JSON.stringify(details));
  } catch {
    /* localStorage недоступен — просто проигнорировать */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
}

export function clearConsent() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
    window.localStorage.removeItem(CONSENT_DETAILS_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
}

export function subscribeConsent(callback: () => void): () => void {
  const storageHandler = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY) callback();
  };
  // Кастомное событие — основной канал внутри вкладки.
  window.addEventListener(CONSENT_EVENT, callback);
  // storage-событие — синхронизация между вкладками.
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener("storage", storageHandler);
  };
}
