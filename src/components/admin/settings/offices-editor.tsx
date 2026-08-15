"use client";

import { useState, useTransition } from "react";
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
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSettings } from "@/server/actions/admin/settings";

type Office = {
  id: string;
  region?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  lat?: string;
  lng?: string;
};

function genId() {
  return `o-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function normalize(input: unknown): Office[] {
  if (!Array.isArray(input)) return [];
  return input.map((raw) => {
    const o = (raw && typeof raw === "object" ? raw : {}) as Record<
      string,
      unknown
    >;
    return {
      id: (o.id as string) || genId(),
      region: (o.region as string) ?? "",
      city: (o.city as string) ?? "",
      address: (o.address as string) ?? "",
      phone: (o.phone as string) ?? "",
      email: (o.email as string) ?? "",
      hours: (o.hours as string) ?? "",
      lat: o.lat == null ? "" : String(o.lat),
      lng: o.lng == null ? "" : String(o.lng),
    };
  });
}

export function OfficesEditor({ initial }: { initial: unknown }) {
  const [offices, setOffices] = useState<Office[]>(() => normalize(initial));
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function update(id: string, patch: Partial<Office>) {
    setOffices((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }
  function addOffice() {
    setOffices((prev) => [
      ...prev,
      {
        id: genId(),
        region: "",
        city: "",
        address: "",
        phone: "",
        email: "",
        hours: "",
        lat: "",
        lng: "",
      },
    ]);
  }
  function removeOffice(id: string) {
    setOffices((prev) => prev.filter((o) => o.id !== id));
  }
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = offices.findIndex((o) => o.id === active.id);
    const newIdx = offices.findIndex((o) => o.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    setOffices((prev) => arrayMove(prev, oldIdx, newIdx));
  }

  function onSave() {
    const payload = offices.map(({ id: _id, ...rest }) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        const trimmed = typeof v === "string" ? v.trim() : v;
        if (trimmed) {
          if (k === "lat" || k === "lng") {
            const n = Number(trimmed);
            if (!Number.isNaN(n)) out[k] = n;
          } else {
            out[k] = trimmed;
          }
        }
      }
      return out;
    });
    startTransition(async () => {
      const res = await updateSettings({ "contacts.offices": payload });
      if (res.ok) {
        toast.success("Офисы сохранены");
      } else {
        toast.error(res.message || "Ошибка");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Офисы (contacts.offices)</CardTitle>
        <CardDescription>
          Список филиалов: регион, город, адрес, телефон, email, часы работы и
          координаты. Перетаскивайте для сортировки.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={offices.map((o) => o.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-3">
              {offices.map((o) => (
                <SortableOffice
                  key={o.id}
                  office={o}
                  onChange={(patch) => update(o.id, patch)}
                  onRemove={() => removeOffice(o.id)}
                  disabled={pending}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {offices.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            Офисов нет.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addOffice}>
            <Plus className="mr-1 h-4 w-4" /> Добавить офис
          </Button>
          <Button type="button" onClick={onSave} disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить офисы
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableOffice({
  office,
  onChange,
  onRemove,
  disabled,
}: {
  office: Office;
  onChange: (patch: Partial<Office>) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: office.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="rounded-md border bg-background p-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
          <span className="sr-only">Сортировать</span>
        </button>
        <span className="text-xs text-muted-foreground">
          {office.city || office.region || "Новый офис"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={disabled}
        >
          <Trash2 className="h-3 w-3" />
          <span className="sr-only">Удалить</span>
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Округ (необязательно)">
          <Input
            value={office.region ?? ""}
            onChange={(e) => onChange({ region: e.target.value })}
            disabled={disabled}
            placeholder="ЦФО / ПФО / СКФО"
          />
        </Field>
        <Field label="Город">
          <Input
            value={office.city ?? ""}
            onChange={(e) => onChange({ city: e.target.value })}
            disabled={disabled}
            placeholder="Город"
          />
        </Field>
        <Field label="Адрес" className="sm:col-span-2">
          <Textarea
            rows={2}
            value={office.address ?? ""}
            onChange={(e) => onChange({ address: e.target.value })}
            disabled={disabled}
            placeholder="ул. ..."
          />
        </Field>
        <Field label="Телефон">
          <Input
            value={office.phone ?? ""}
            onChange={(e) => onChange({ phone: e.target.value })}
            disabled={disabled}
            placeholder="+7 (XXX) ..."
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={office.email ?? ""}
            onChange={(e) => onChange({ email: e.target.value })}
            disabled={disabled}
          />
        </Field>
        <Field label="Часы работы">
          <Input
            value={office.hours ?? ""}
            onChange={(e) => onChange({ hours: e.target.value })}
            disabled={disabled}
            placeholder="Пн–Пт 9:00–18:00"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="lat">
            <Input
              value={office.lat ?? ""}
              onChange={(e) => onChange({ lat: e.target.value })}
              disabled={disabled}
              placeholder="43.31"
            />
          </Field>
          <Field label="lng">
            <Input
              value={office.lng ?? ""}
              onChange={(e) => onChange({ lng: e.target.value })}
              disabled={disabled}
              placeholder="45.69"
            />
          </Field>
        </div>
      </div>
    </li>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"space-y-1 " + (className ?? "")}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
