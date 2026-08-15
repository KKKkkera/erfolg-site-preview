"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteMedia } from "@/server/actions/admin/media";
import { cn } from "@/lib/utils";

type MediaItem = {
  id: string;
  url: string;
  alt: string | null;
  mime: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  origin: string | null;
  createdAt: Date | string;
};

export function MediaList({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function onDelete(id: string) {
    startTransition(async () => {
      const res = await deleteMedia(id);
      if (res.ok) {
        toast.success("Файл удалён");
        setConfirmId(null);
        router.refresh();
      } else {
        toast.error(res.message || "Не удалось удалить");
      }
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((m) => (
          <div
            key={m.id}
            className="group relative overflow-hidden rounded-md border bg-background"
          >
            <div className="aspect-square w-full bg-muted">
              {m.mime?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt={m.alt ?? ""}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                  {m.mime ?? "файл"}
                </div>
              )}
            </div>
            <div className="space-y-1 p-2 text-xs">
              <div className="truncate" title={m.alt ?? ""}>
                {m.alt || <span className="text-muted-foreground">без alt</span>}
              </div>
              <div className="text-muted-foreground">
                {m.size ? `${Math.round(m.size / 1024)} КБ` : "—"}
                {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
              </div>
              <div className="flex items-center gap-1 pt-1">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  открыть
                </a>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(m.url);
                    toast.success("URL скопирован");
                  }}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  copy
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 text-muted-foreground hover:text-destructive",
                  )}
                  onClick={() => setConfirmId(m.id)}
                  disabled={pending}
                  title="Удалить"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="sr-only">Удалить</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить файл?</DialogTitle>
            <DialogDescription>
              Файл будет удалён из S3 и из базы данных. Действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmId(null)}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmId && onDelete(confirmId)}
              disabled={pending}
            >
              {pending ? "Удаление…" : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
