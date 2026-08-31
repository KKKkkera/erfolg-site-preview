"use server";

import { putPreview } from "@/lib/preview-store";
import { requireAdmin } from "@/server/actions/admin/auth";

/**
 * Кладёт черновик в буфер предпросмотра и возвращает токен.
 * Конструктор открывает /admin/preview?t=<токен> в новой вкладке.
 */
export async function createPreview(
  content: string,
  leadSource: string,
): Promise<{ ok: true; token: string } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  // Ограничение то же, что у контента страницы: буфер не должен становиться
  // способом залить в память произвольный объём данных.
  if (content.length > 80000) {
    return { ok: false, message: "Слишком большой черновик" };
  }

  return { ok: true, token: putPreview(content, leadSource) };
}
