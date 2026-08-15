"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { clearSettingsCache } from "@/lib/settings";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin/auth";

/**
 * Массовое сохранение настроек.
 * input — объект { "company.inn": "...", "contacts.offices": [...] }.
 * Принимаются любые JSON-сериализуемые значения.
 */
export async function updateSettings(
  input: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  if (!input || typeof input !== "object") {
    return { ok: false, message: "Некорректные данные" };
  }
  const entries = Object.entries(input);
  if (entries.length === 0) return { ok: true };

  try {
    await db.$transaction(
      entries.map(([key, value]) =>
        db.setting.upsert({
          where: { key },
          create: { key, value: value as Prisma.InputJsonValue },
          update: { value: value as Prisma.InputJsonValue },
        }),
      ),
    );
    clearSettingsCache();
    await logAction(admin.id, "update", "Setting", null, {
      keys: entries.map(([k]) => k),
    });
    revalidatePath("/");
    revalidatePath("/contacts");
    revalidatePath("/about");
    return { ok: true };
  } catch (e) {
    console.error("updateSettings error", e);
    return { ok: false, message: "Не удалось сохранить настройки" };
  }
}
