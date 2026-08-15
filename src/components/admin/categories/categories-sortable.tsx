"use client";

import { Fragment, useState, useTransition } from "react";
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

import { reorderCategories } from "@/server/actions/admin/categories";
import { cn } from "@/lib/utils";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sort: number;
  parentName: string | null;
  productsCount: number;
  childrenCount: number;
};

type Group = {
  parentId: string | null;
  parentName: string | null;
  items: CategoryRow[];
};

function makeGroups(rows: CategoryRow[]): Group[] {
  const map = new Map<string, Group>();
  for (const r of rows) {
    const key = r.parentId ?? "__root__";
    const g =
      map.get(key) ??
      ({
        parentId: r.parentId,
        parentName: r.parentName,
        items: [] as CategoryRow[],
      } satisfies Group);
    g.items.push(r);
    map.set(key, g);
  }
  // sort each group by sort then name
  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    items: [...g.items].sort(
      (a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "ru"),
    ),
  }));
  // Корневая первая, остальные — по имени родителя
  groups.sort((a, b) => {
    if (a.parentId === null && b.parentId !== null) return -1;
    if (a.parentId !== null && b.parentId === null) return 1;
    return (a.parentName ?? "").localeCompare(b.parentName ?? "", "ru");
  });
  return groups;
}

export function CategoriesSortable({ rows }: { rows: CategoryRow[] }) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>(() => makeGroups(rows));
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(groupIdx: number, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const grp = groups[groupIdx];
    const oldIdx = grp.items.findIndex((i) => i.id === active.id);
    const newIdx = grp.items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const nextItems = arrayMove(grp.items, oldIdx, newIdx);
    const nextGroups = groups.map((g, i) =>
      i === groupIdx ? { ...g, items: nextItems } : g,
    );
    setGroups(nextGroups);
    startTransition(async () => {
      const res = await reorderCategories({
        parentId: grp.parentId,
        ids: nextItems.map((it) => it.id),
      });
      if (!res.ok) {
        toast.error(res.message || "Не удалось сохранить порядок");
        setGroups(makeGroups(rows));
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <Fragment key={g.parentId ?? "__root__"}>
          <div className="rounded-md border bg-background">
            <div className="border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {g.parentId === null
                ? "Верхний уровень"
                : `Подкатегории: ${g.parentName ?? "—"}`}
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={(e) => handleDragEnd(gi, e)}
            >
              <SortableContext
                items={g.items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="divide-y">
                  {g.items.map((it) => (
                    <SortableRow key={it.id} item={it} disabled={pending} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function SortableRow({
  item,
  disabled,
}: {
  item: CategoryRow;
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
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm",
        isDragging && "bg-muted",
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        disabled={disabled}
        title="Перетащите"
      >
        <GripVertical className="h-4 w-4" />
        <span className="sr-only">Сортировать</span>
      </button>
      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/categories/${item.id}`}
          className="font-medium hover:underline"
        >
          {item.name}
        </Link>
        <div className="text-xs text-muted-foreground">/{item.slug}</div>
      </div>
      <div className="hidden gap-3 text-xs text-muted-foreground sm:flex">
        <span>товаров: {item.productsCount}</span>
        <span>подкат.: {item.childrenCount}</span>
        <span>sort: {item.sort}</span>
      </div>
    </li>
  );
}
