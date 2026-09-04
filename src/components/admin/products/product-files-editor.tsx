"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addProductFile,
  removeProductFile,
  renameProductFile,
  reorderProductFiles,
  requestProductFileUpload,
} from "@/server/actions/admin/product-files";

export type ProductFileItem = {
  id: string;
  url: string;
  label: string;
  sort: number;
};

const ACCEPT =
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png";
const MAX_SIZE = 25 * 1024 * 1024;

/** Название по умолчанию — имя файла без расширения. Дальше его правят руками. */
function defaultLabel(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  return base.trim().slice(0, 200) || "Документ";
}

export function ProductFilesEditor({
  productId,
  initial,
  s3Configured,
}: {
  productId: string;
  initial: ProductFileItem[];
  s3Configured: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ProductFileItem[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const prev = items;
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    startTransition(async () => {
      const res = await reorderProductFiles({
        productId,
        ids: next.map((i) => i.id),
      });
      if (!res.ok) {
        toast.error(res.message || "Не удалось сохранить порядок");
        setItems(prev);
      } else {
        router.refresh();
      }
    });
  }

  async function handleFiles(files: FileList | File[]) {
    if (!s3Configured) {
      toast.error("Загрузка отключена: S3 не настроен");
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name}: больше 25 МБ`);
          continue;
        }

        // 1. Подписанная ссылка на загрузку.
        const presign = await requestProductFileUpload({
          filename: file.name,
          mime: file.type,
          size: file.size,
        });
        if (!presign.ok) {
          toast.error(`${file.name}: ${presign.message}`);
          continue;
        }

        // 2. Кладём файл в хранилище напрямую, минуя наш сервер.
        try {
          const put = await fetch(presign.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!put.ok) throw new Error(`S3 ${put.status}`);
        } catch (e) {
          toast.error(
            `${file.name}: ${e instanceof Error ? e.message : "ошибка загрузки"}`,
          );
          continue;
        }

        // 3. Запись в базе — только после того, как файл лёг в хранилище.
        const added = await addProductFile({
          productId,
          url: presign.url,
          label: defaultLabel(file.name),
        });
        if (!added.ok) {
          toast.error(`${file.name}: ${added.message}`);
          continue;
        }
        setItems((prev) => [
          ...prev,
          {
            id: added.id,
            url: added.url,
            label: added.label,
            sort: added.sort,
          },
        ]);
        toast.success(`${file.name} загружен`);
      }
    } finally {
      setUploading(false);
      router.refresh();
    }
  }

  function handleRename(id: string, label: string) {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Название не может быть пустым");
      setItems(initial);
      return;
    }
    const current = items.find((i) => i.id === id);
    if (current && current.label === trimmed) return;
    startTransition(async () => {
      const res = await renameProductFile({ id, label: trimmed });
      if (!res.ok) {
        toast.error(res.message || "Не удалось переименовать");
      } else {
        router.refresh();
      }
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const res = await removeProductFile(id);
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id));
        toast.success("Документ удалён");
        router.refresh();
      } else {
        toast.error(res.message || "Не удалось удалить");
      }
    });
  }

  const busy = pending || uploading;

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          Документов пока нет. На странице товара вкладка «Документы» покажет
          текст «предоставляются по запросу».
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {items.map((file) => (
                <SortableFile
                  key={file.id}
                  item={file}
                  disabled={busy}
                  onRename={(label) => handleRename(file.id, label)}
                  onRemove={() => handleRemove(file.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {s3Configured ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Добавить документ
          </Button>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX, XLS, XLSX, JPG, PNG — до 25 МБ.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                void handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />
        </>
      ) : (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs">
          Загрузка отключена: не настроен Selectel S3 (переменные{" "}
          <code>S3_*</code> в .env).
        </div>
      )}
    </div>
  );
}

function SortableFile({
  item,
  disabled,
  onRename,
  onRemove,
}: {
  item: ProductFileItem;
  disabled?: boolean;
  onRename: (label: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-background p-2"
    >
      <button
        type="button"
        className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        title="Перетащите для сортировки"
      >
        <GripVertical className="h-4 w-4" />
        <span className="sr-only">Сортировать</span>
      </button>
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-1">
        {/* Название посетитель видит на вкладке «Документы», поэтому правится
            прямо здесь: имя файла из проводника читается плохо. */}
        <Input
          defaultValue={item.label}
          maxLength={200}
          disabled={disabled}
          className="h-8"
          onBlur={(e) => onRename(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-xs text-muted-foreground hover:underline"
        >
          {item.url}
        </a>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-destructive"
        onClick={onRemove}
        disabled={disabled}
        title="Удалить"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Удалить</span>
      </Button>
    </li>
  );
}
