"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { confirmUpload } from "@/server/actions/admin/media";
import { cn } from "@/lib/utils";

type FileItem = {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "confirming" | "done" | "error";
  message?: string;
  url?: string;
};

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/svg+xml,image/avif,image/gif";
const MAX_SIZE = 10 * 1024 * 1024;

export function MediaUploader({
  s3Configured,
  origin = "media",
  onUploaded,
  compact = false,
}: {
  s3Configured: boolean;
  origin?: string;
  /** Колбэк после успешной загрузки одного файла. */
  onUploaded?: (asset: { id: string; url: string; alt?: string | null }) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      if (!s3Configured) {
        toast.error("Загрузка отключена: S3 не настроен");
        return;
      }
      const arr = Array.from(files);
      const fresh: FileItem[] = arr.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        progress: 0,
        status: "pending",
      }));
      setItems((prev) => [...prev, ...fresh]);

      for (const item of fresh) {
        const file = item.file;

        if (file.size > MAX_SIZE) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, status: "error", message: "Больше 10 МБ" }
                : p,
            ),
          );
          continue;
        }
        if (!file.type.startsWith("image/")) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, status: "error", message: "Не изображение" }
                : p,
            ),
          );
          continue;
        }

        // 1. Получить presigned URL
        let presign:
          | {
              uploadUrl: string;
              key: string;
              publicUrl: string;
            }
          | null = null;
        try {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, status: "uploading" } : p,
            ),
          );
          const res = await fetch("/api/admin/media/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              mime: file.type,
              size: file.size,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Не удалось получить ссылку");
          }
          presign = await res.json();
        } catch (e) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    status: "error",
                    message: e instanceof Error ? e.message : "Ошибка",
                  }
                : p,
            ),
          );
          continue;
        }
        if (!presign) continue;

        // 2. PUT на S3 с onprogress
        try {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", presign!.uploadUrl, true);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable) {
                const pct = Math.round((ev.loaded / ev.total) * 100);
                setItems((prev) =>
                  prev.map((p) =>
                    p.id === item.id ? { ...p, progress: pct } : p,
                  ),
                );
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`S3 ${xhr.status}`));
            };
            xhr.onerror = () => reject(new Error("Сеть"));
            xhr.send(file);
          });
        } catch (e) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    status: "error",
                    message: e instanceof Error ? e.message : "Ошибка",
                  }
                : p,
            ),
          );
          continue;
        }

        // 3. Подтверждение через Server Action
        try {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, status: "confirming" } : p,
            ),
          );
          const res = await confirmUpload({
            key: presign.key,
            mime: file.type,
            size: file.size,
            origin,
          });
          if (!res.ok) {
            throw new Error(res.message);
          }
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    status: "done",
                    progress: 100,
                    url: res.url,
                  }
                : p,
            ),
          );
          onUploaded?.({ id: res.id, url: res.url });
        } catch (e) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    status: "error",
                    message: e instanceof Error ? e.message : "Ошибка",
                  }
                : p,
            ),
          );
        }
      }

      router.refresh();
    },
    [router, s3Configured, origin, onUploaded],
  );

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleUpload(e.dataTransfer.files);
    }
  }

  if (!s3Configured) {
    return (
      <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
        <p className="font-medium">Selectel S3 не настроен</p>
        <p className="mt-1 text-muted-foreground">
          Заполните переменные <code>S3_ENDPOINT</code>, <code>S3_ACCESS_KEY</code>,{" "}
          <code>S3_SECRET_KEY</code>, <code>S3_BUCKET</code> в .env. Загрузка
          отключена.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-md border-2 border-dashed bg-background p-6 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-muted",
          compact ? "py-4" : "py-8",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm">
          Перетащите файлы сюда или{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => inputRef.current?.click()}
          >
            выберите
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, WebP, AVIF, SVG, GIF — до 10 МБ
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              void handleUpload(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-3 rounded-md border bg-background p-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{it.file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(it.file.size / 1024).toFixed(0)} КБ
                  {it.message ? ` · ${it.message}` : ""}
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all",
                      it.status === "error"
                        ? "bg-destructive"
                        : it.status === "done"
                          ? "bg-success"
                          : "bg-primary",
                    )}
                    style={{ width: `${it.progress}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {it.status === "uploading" || it.status === "confirming" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : it.status === "error" ? (
                  <span className="text-destructive">ошибка</span>
                ) : it.status === "done" ? (
                  <span className="text-success">готово</span>
                ) : (
                  <span>…</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  setItems((prev) => prev.filter((p) => p.id !== it.id))
                }
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Убрать</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
