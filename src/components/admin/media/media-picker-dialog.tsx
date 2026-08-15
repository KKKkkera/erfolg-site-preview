"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MediaUploader } from "./media-uploader";

type MediaItem = {
  id: string;
  url: string;
  alt: string | null;
  mime: string | null;
};

export function MediaPickerDialog({
  triggerLabel = "Выбрать из медиатеки",
  triggerVariant = "outline",
  onSelect,
  s3Configured,
  origin = "media",
  initialOpen = false,
  controlledOpen,
  onOpenChange,
  triggerClassName,
  asChildTrigger,
  trigger,
}: {
  triggerLabel?: string;
  triggerVariant?:
    | "default"
    | "outline"
    | "ghost"
    | "secondary"
    | "destructive"
    | "link";
  onSelect: (asset: { id: string; url: string; alt: string | null }) => void;
  s3Configured: boolean;
  origin?: string;
  initialOpen?: boolean;
  controlledOpen?: boolean;
  onOpenChange?: (v: boolean) => void;
  triggerClassName?: string;
  asChildTrigger?: boolean;
  trigger?: React.ReactNode;
}) {
  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(initialOpen);
  const open = isControlled ? !!controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Спиннер должен включиться синхронно при каждом открытии диалога —
    // это загрузка-по-событию (open), а не каскадный ререндер.
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/api/admin/media/list")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  function refresh() {
    setLoading(true);
    fetch("/api/admin/media/list")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        asChildTrigger ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={triggerClassName}
          >
            {trigger}
          </button>
        ) : (
          trigger
        )
      ) : (
        <Button
          type="button"
          variant={triggerVariant}
          size="sm"
          onClick={() => setOpen(true)}
          className={triggerClassName}
        >
          {triggerLabel}
        </Button>
      )}
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Медиатека</DialogTitle>
          <DialogDescription>
            Загрузите новый файл или выберите из библиотеки.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger value="library">Из библиотеки</TabsTrigger>
            <TabsTrigger value="upload">Загрузить новое</TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Загрузка…
                </div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : items.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Файлов пока нет — загрузите первый.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {items.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelect({ id: m.id, url: m.url, alt: m.alt });
                        setOpen(false);
                      }}
                      className="group relative aspect-square overflow-hidden rounded-md border bg-muted transition hover:ring-2 hover:ring-primary"
                    >
                      {m.mime?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.url}
                          alt={m.alt ?? ""}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-muted-foreground">
                          {m.mime ?? "файл"}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <MediaUploader
              s3Configured={s3Configured}
              origin={origin}
              compact
              onUploaded={(asset) => {
                refresh();
                onSelect({ id: asset.id, url: asset.url, alt: asset.alt ?? null });
                setOpen(false);
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

