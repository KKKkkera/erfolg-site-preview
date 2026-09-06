import { z } from "zod";

/**
 * URL admin-вводимый, который потом может быть рендерен или зафетчен на сервере.
 *
 * Разрешён только https:// и http:// (на dev для проверки), запрещены:
 *  - file://, javascript:, data:, gopher:, ftp://
 *  - приватные/локальные хосты (127.x, 10.x, 192.168.x, 169.254.x, ::1, localhost)
 *
 * Защищает от SSRF и XSS через JavaScript: URLs.
 */
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (h.includes(":") && (!/^[23]/.test(h) || h.startsWith("2001:db8:"))) return true;
  if (
    h === "localhost" ||
    h === "::1" ||
    h.endsWith(".local") ||
    h.endsWith(".localhost") ||
    h.endsWith(".internal")
  ) {
    return true;
  }
  // IPv4 проверка
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [, a, b] = m.map(Number);
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local + AWS metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

const SafeUrlSchema = z
  .string()
  .trim()
  .url("Некорректный URL")
  .refine(
    (v) => {
      try {
        const u = new URL(v);
        if (!["https:", "http:"].includes(u.protocol)) return false;
        if (isPrivateHost(u.hostname)) return false;
        return true;
      } catch {
        return false;
      }
    },
    { message: "Допустим только публичный https:// или http:// URL" },
  );

/** Полная схема для обязательных публичных URL. */
export const safeUrl = SafeUrlSchema;

/** Опциональная схема: принимает пустую строку. */
export const optionalSafeUrl = SafeUrlSchema.optional().or(z.literal(""));
