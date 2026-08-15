"use client";

import { useState, useTransition } from "react";
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";
import {
  addProductImage,
  removeProductImage,
  reorderProductImages,
} from "@/server/actions/admin/product-images";

export type ProductImageItem = {
  id: string;
  url: string;
  alt: string | null;
  sort: number;
};

export function ProductImagesEditor({
  productId,
  initial,
  s3Configured,
}: {
  productId: string;
  initial: ProductImageItem[];
  s3Configured: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<ProductImageItem[]>(initial);
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
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    startTransition(async () => {
      const res = await reorderProductImages({
        productId,
        ids: next.map((i) => i.id),
      });
      if (!res.ok) {
        toast.error(res.message || "Не удалось сохранить порядок");
        setItems(initial);
      } else {
        router.refresh();
      }
    });
  }

  function handlePicked(asset: { id: string; url: string; alt: string | null }) {
    startTransition(async () => {
      const res = await addProductImage({
        productId,
        url: asset.url,
        alt: asset.alt,
      });
      if (res.ok) {
        setItems((prev) => [
          ...prev,
          { id: res.id, url: res.url, alt: res.alt, sort: res.sort },
        ]);
        toast.success("Изображение добавлено");
        router.refresh();
      } else {
        toast.error(res.message || "Не удалось добавить");
      }
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const res = await removeProductImage(id);
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id));
        toast.success("Изображение удалено");
        router.refresh();
      } else {
        toast.error(res.message || "Не удалось удалить");
      }
    });
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          Изображений пока нет.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((img) => (
                <SortableImage
                  key={img.id}
                  item={img}
                  onRemove={() => handleRemove(img.id)}
                  disabled={pending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <MediaPickerDialog
        triggerLabel="Добавить изображение"
        onSelect={handlePicked}
        s3Configured={s3Configured}
        origin="product"
      />
    </div>
  );
}

function SortableImage({
  item,
  onRemove,
  disabled,
}: {
  item: ProductImageItem;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative overflow-hidden rounded-md border bg-background"
    >
      <div className="aspect-square w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.alt ?? ""}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <button
        type="button"
        className="absolute left-1 top-1 rounded bg-background/80 p-1 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        title="Перетащите для сортировки"
      >
        <GripVertical className="h-3 w-3" />
        <span className="sr-only">Сортировать</span>
      </button>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute right-1 top-1 h-6 w-6 opacity-90"
        onClick={onRemove}
        disabled={disabled}
        title="Удалить"
      >
        <Trash2 className="h-3 w-3" />
        <span className="sr-only">Удалить</span>
      </Button>
    </div>
  );
}
