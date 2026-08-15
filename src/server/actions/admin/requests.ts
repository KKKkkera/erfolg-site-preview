"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { requireAdmin } from "@/server/actions/admin/auth";

const StatusSchema = z.enum(["NEW", "IN_PROGRESS", "DONE", "REJECTED"]);
const TypeSchema = z.enum(["quote", "service", "contact"]);

export type RequestStatusResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateRequestStatus(
  type: z.infer<typeof TypeSchema>,
  id: string,
  status: z.infer<typeof StatusSchema>,
): Promise<RequestStatusResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const t = TypeSchema.safeParse(type);
  const s = StatusSchema.safeParse(status);
  if (!t.success || !s.success) {
    return { ok: false, message: "Неверные параметры" };
  }

  try {
    if (t.data === "quote") {
      await db.quoteRequest.update({
        where: { id },
        data: { status: s.data },
      });
    } else if (t.data === "service") {
      await db.serviceRequest.update({
        where: { id },
        data: { status: s.data },
      });
    } else {
      await db.contactRequest.update({
        where: { id },
        data: { status: s.data },
      });
    }
    await logAction(
      admin.id,
      "status",
      t.data === "quote"
        ? "QuoteRequest"
        : t.data === "service"
          ? "ServiceRequest"
          : "ContactRequest",
      id,
      { status: s.data },
    );
    revalidatePath("/admin/requests");
    revalidatePath(`/admin/requests/${t.data}/${id}`);
    return { ok: true };
  } catch (e) {
    console.error("updateRequestStatus error", e);
    return { ok: false, message: "Не удалось обновить статус" };
  }
}

/**
 * Удаление заявки вместе с ПДн заявителя.
 *
 * Нужно для исполнения 152-ФЗ: субъект вправе потребовать уничтожения своих
 * данных, а политика обещает уничтожение по достижении целей обработки.
 * До этого удалить заявку можно было только руками в SQL.
 * Факт удаления фиксируется в аудит-логе (без содержимого заявки).
 */
export async function deleteRequest(
  type: z.infer<typeof TypeSchema>,
  id: string,
): Promise<RequestStatusResult> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, message: "Unauthorized" };

  const t = TypeSchema.safeParse(type);
  if (!t.success || !id) {
    return { ok: false, message: "Неверные параметры" };
  }

  try {
    if (t.data === "quote") {
      await db.quoteRequest.delete({ where: { id } });
    } else if (t.data === "service") {
      await db.serviceRequest.delete({ where: { id } });
    } else {
      await db.contactRequest.delete({ where: { id } });
    }
    await logAction(
      admin.id,
      "delete",
      t.data === "quote"
        ? "QuoteRequest"
        : t.data === "service"
          ? "ServiceRequest"
          : "ContactRequest",
      id,
    );
    revalidatePath("/admin/requests");
    revalidatePath(`/admin/requests/${t.data}`);
    return { ok: true };
  } catch (e) {
    console.error("deleteRequest error", e);
    return { ok: false, message: "Не удалось удалить заявку" };
  }
}
