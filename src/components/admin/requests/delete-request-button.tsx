"use client";

import { useRouter } from "next/navigation";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteRequest } from "@/server/actions/admin/requests";

/**
 * Кнопка «Удалить заявку» для страниц /admin/requests/<type>/[id].
 * После успешного удаления уводит на список заявок этого типа —
 * оставаться на странице удалённой записи нельзя (refresh дал бы 404).
 */
export function DeleteRequestButton({
  type,
  id,
}: {
  type: "quote" | "service" | "contact";
  id: string;
}) {
  const router = useRouter();

  async function handleDelete(requestId: string) {
    const res = await deleteRequest(type, requestId);
    if (res.ok) {
      router.push(`/admin/requests/${type}`);
      router.refresh();
    }
    return res;
  }

  return (
    <ConfirmDeleteButton
      id={id}
      variant="destructive"
      size="default"
      label="Удалить заявку"
      description="Заявка и персональные данные заявителя будут удалены безвозвратно. Факт удаления останется в журнале аудита (без содержимого)."
      onDelete={handleDelete}
    />
  );
}
