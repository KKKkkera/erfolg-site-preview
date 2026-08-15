"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteReview,
  updateReviewStatus,
} from "@/server/actions/admin/reviews";

type Status = "PENDING" | "PUBLISHED" | "REJECTED";

export function ReviewModeration({
  id,
  status,
  moderatorNote,
}: {
  id: string;
  status: Status;
  moderatorNote: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState(moderatorNote ?? "");
  const [isPending, startTransition] = useTransition();

  const setStatus = (next: Status) => {
    startTransition(async () => {
      const res = await updateReviewStatus(id, next, note);
      if (res.ok) {
        toast.success(
          next === "PUBLISHED"
            ? "Отзыв опубликован"
            : next === "REJECTED"
              ? "Отзыв отклонён"
              : "Отзыв возвращён на модерацию",
        );
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const remove = () => {
    // Автор может отозвать согласие — тогда отзыв удаляется, а не прячется.
    if (!confirm("Удалить отзыв безвозвратно?")) return;
    startTransition(async () => {
      const res = await deleteReview(id);
      if (res.ok) {
        toast.success("Отзыв удалён");
        router.push("/admin/reviews");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="moderatorNote">Заметка модератора</Label>
        <Textarea
          id="moderatorNote"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Например: подтверждено по договору №… от…"
        />
        <p className="text-xs text-muted-foreground">
          Видна только в админке. Сохраняется вместе со сменой статуса.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {status !== "PUBLISHED" ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => setStatus("PUBLISHED")}
          >
            Опубликовать
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setStatus("PENDING")}
          >
            Снять с публикации
          </Button>
        )}
        {status !== "REJECTED" ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setStatus("REJECTED")}
          >
            Отклонить
          </Button>
        ) : null}
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={remove}
        >
          Удалить
        </Button>
      </div>
    </div>
  );
}
