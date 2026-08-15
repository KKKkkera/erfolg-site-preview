import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Тонкая обёртка над `db.adminAuditLog.create` — никогда не бросает наружу.
 * Предназначена для server actions и API-роутов.
 *
 * НЕ "use server" — вызывается только из уже авторизованных server actions
 * (которые сами проверили права через requireAdmin()).
 */
export async function logAdminAction({
  adminId,
  action,
  entity,
  entityId,
  meta,
  ip,
  userAgent,
}: {
  adminId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        adminId: adminId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        meta: (meta as Prisma.InputJsonValue | undefined) ?? undefined,
        // Колонки существовали с самого начала, но не заполнялись —
        // журнал не отвечал на вопрос «откуда выполнено действие».
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (e) {
    // Аудит не должен ломать основной поток
    console.error("audit log error", e);
  }
}

/**
 * Позиционная форма для удобства существующих вызовов.
 * Не "use server".
 */
export async function logAction(
  adminId: string,
  action: string,
  entity: string,
  entityId?: string | null,
  meta?: unknown,
): Promise<void> {
  return logAdminAction({ adminId, action, entity, entityId, meta });
}
