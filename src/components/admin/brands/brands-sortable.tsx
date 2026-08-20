"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { reorderBrands } from "@/server/actions/admin/brands";

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  website: string | null;
  logo: string | null;
  sort: number;
  productsCount: number;
};

export function BrandsSortable({ rows }: { rows: BrandRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sort: (index + 1) * 10,
    }));
    setItems(nextItems);

    startTransition(async () => {
      const result = await reorderBrands({ ids: nextItems.map((item) => item.id) });
      if (!result.ok) {
        toast.error(result.message || "Не удалось сохранить порядок брендов");
        setItems(rows);
        return;
      }

      toast.success("Порядок брендов сохранён");
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <span className="sr-only">Перемещение</span>
              </TableHead>
              <TableHead>Название</TableHead>
              <TableHead className="w-[90px] text-center">Логотип</TableHead>
              <TableHead className="w-[90px] text-center">Позиция</TableHead>
              <TableHead className="w-[160px]">Страна</TableHead>
              <TableHead className="w-[200px]">Сайт</TableHead>
              <TableHead className="w-[110px] text-center">Товаров</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {items.map((item, index) => (
                <SortableBrandRow
                  key={item.id}
                  item={item}
                  position={index + 1}
                  disabled={pending}
                />
              ))}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>
    </div>
  );
}

function SortableBrandRow({
  item,
  position,
  disabled,
}: {
  item: BrandRow;
  position: number;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
      }}
      className={cn(isDragging && "relative z-10 bg-muted shadow-sm")}
    >
      <TableCell className="w-12 pr-0">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:cursor-wait"
          {...attributes}
          {...listeners}
          disabled={disabled}
          title="Перетащите, чтобы изменить порядок"
        >
          <GripVertical className="h-5 w-5" />
          <span className="sr-only">Изменить позицию бренда {item.name}</span>
        </button>
      </TableCell>
      <TableCell>
        <Link
          href={`/admin/brands/${item.id}`}
          className="font-medium hover:underline"
        >
          {item.name}
        </Link>
        <div className="text-xs text-muted-foreground">/{item.slug}</div>
      </TableCell>
      <TableCell className="text-center">
        {item.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.logo}
            alt=""
            className="mx-auto h-7 w-16 object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-muted-foreground">текст</span>
        )}
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">
        {position}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {item.country || "—"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {item.website ? (
          <a
            href={item.website}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {item.website}
          </a>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-center text-sm">{item.productsCount}</TableCell>
    </TableRow>
  );
}
