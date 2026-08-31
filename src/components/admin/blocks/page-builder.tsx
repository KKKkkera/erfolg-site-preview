"use client";

import { useMemo, useState, useTransition } from "react";
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
import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Eye,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { BlockIcon, BlockThumb } from "@/components/admin/blocks/block-preview";
import { BLOCKS_BY_TYPE, blocksForScope } from "@/lib/content-blocks";
import {
  createBuilderBlock,
  serializeBuilderBlocks,
  toBuilderBlocks,
  type BuilderBlock,
} from "@/lib/parse-content-blocks";
import { createPreview } from "@/server/actions/admin/preview";
import { cn } from "@/lib/utils";

/* Конструктор страницы: блоки перетаскиваются, настраиваются и складываются
   в тот же HTML с шорткодами, что и раньше. Наружу отдаётся строка контента —
   форма сохраняет её в то же поле, рендер на сайте не меняется. */

type Props = {
  value: string;
  onChange: (content: string) => void;
  scope: "region" | "product" | "page";
  s3Configured: boolean;
  /** Источник для формы заявки в предпросмотре. */
  leadSource?: string;
};

export function PageBuilder({
  value,
  onChange,
  scope,
  s3Configured,
  leadSource = "preview",
}: Props) {
  // Разбираем сохранённый контент один раз: дальше источник правды — список
  // блоков, а value пересобирается из него при каждом изменении.
  const [blocks, setBlocks] = useState<BuilderBlock[]>(() =>
    toBuilderBlocks(value),
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [previewPending, startPreview] = useTransition();

  const palette = useMemo(() => blocksForScope(scope), [scope]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /** Любое изменение списка сразу пересобирает контент для формы. */
  function commit(next: BuilderBlock[]) {
    setBlocks(next);
    onChange(serializeBuilderBlocks(next));
  }

  function addBlock(type: string) {
    const def = BLOCKS_BY_TYPE.get(type);
    const params: Record<string, string> = {};
    for (const param of def?.params ?? []) {
      if (param.defaultValue) params[param.key] = param.defaultValue;
    }
    const block = createBuilderBlock(type, params);
    commit([...blocks, block]);
    setAdding(false);
    // Блок с настройками сразу разворачиваем — иначе непонятно, что дальше.
    if ((def?.params.length ?? 0) > 0 || type === "text") setOpenId(block.id);
  }

  function updateBlock(id: string, patch: Partial<BuilderBlock>) {
    commit(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function removeBlock(id: string) {
    commit(blocks.filter((b) => b.id !== id));
  }

  function duplicateBlock(id: string) {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const source = blocks[idx];
    const copy = createBuilderBlock(source.type, { ...source.params });
    copy.html = source.html;
    const next = [...blocks];
    next.splice(idx + 1, 0, copy);
    commit(next);
  }

  function move(id: string, delta: number) {
    const idx = blocks.findIndex((b) => b.id === id);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= blocks.length) return;
    commit(arrayMove(blocks, idx, target));
  }

  /* Предпросмотр: черновик уезжает серверным экшеном в буфер, а вкладка
     открывается по короткому токену. В адресе контент не передаём — страница
     с десятком блоков перевалит лимит длины URL и осядет в истории браузера.

     Вкладку открываем сразу по клику, до await: если открыть её после
     ответа сервера, браузер посчитает это не-пользовательским действием и
     заблокирует как попап. */
  function openPreview() {
    const tab = window.open("", "_blank");
    startPreview(async () => {
      const res = await createPreview(serializeBuilderBlocks(blocks), leadSource);
      if (res.ok) {
        if (tab) tab.location.href = `/admin/preview?t=${res.token}`;
      } else {
        tab?.close();
        toast.error(res.message || "Не удалось открыть предпросмотр");
      }
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    commit(arrayMove(blocks, oldIdx, newIdx));
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm font-medium">Страница пустая</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Добавьте первый блок — текст, карту, форму заявки или цифры.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {blocks.map((block, i) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  index={i}
                  total={blocks.length}
                  open={openId === block.id}
                  onToggle={() =>
                    setOpenId(openId === block.id ? null : block.id)
                  }
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                  onDuplicate={duplicateBlock}
                  onMove={move}
                  s3Configured={s3Configured}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Блоков: {blocks.length}
        </span>
        {blocks.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={openPreview}
            disabled={previewPending}
          >
            <Eye className="mr-2 h-4 w-4" /> Предпросмотр страницы
          </Button>
        ) : null}
      </div>

      {adding ? (
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Выберите блок</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAdding(false)}
            >
              Отмена
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {palette.map((def) => (
              <button
                key={def.type}
                type="button"
                onClick={() => addBlock(def.type)}
                className="flex items-start gap-3 rounded-md border bg-background p-3 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <BlockIcon
                  name={def.icon}
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{def.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {def.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Добавить блок
        </Button>
      )}
    </div>
  );
}

function SortableBlock({
  block,
  index,
  total,
  open,
  onToggle,
  onUpdate,
  onRemove,
  onDuplicate,
  onMove,
  s3Configured,
}: {
  block: BuilderBlock;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onUpdate: (id: string, patch: Partial<BuilderBlock>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, delta: number) => void;
  s3Configured: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const def = BLOCKS_BY_TYPE.get(block.type);
  const isText = block.type === "text";
  const hasSettings = (def?.params.length ?? 0) > 0 || isText;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-md border bg-background",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <div className="flex items-center gap-2 border-b px-2 py-1.5">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          title="Перетащить"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {def ? (
          <BlockIcon name={def.icon} className="h-4 w-4 text-muted-foreground" />
        ) : null}
        <span className="truncate text-sm font-medium">
          {def?.label ?? block.type}
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn
            title="Выше"
            disabled={index === 0}
            onClick={() => onMove(block.id, -1)}
          >
            <ChevronUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            title="Ниже"
            disabled={index === total - 1}
            onClick={() => onMove(block.id, 1)}
          >
            <ChevronDown className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Дублировать" onClick={() => onDuplicate(block.id)}>
            <Copy className="h-4 w-4" />
          </IconBtn>
          {hasSettings ? (
            <IconBtn
              title={open ? "Свернуть" : "Настроить"}
              active={open}
              onClick={onToggle}
            >
              <Settings2 className="h-4 w-4" />
            </IconBtn>
          ) : null}
          <IconBtn
            title="Удалить"
            destructive
            onClick={() => onRemove(block.id)}
          >
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      <div className="p-3">
        {isText ? (
          open ? (
            <TiptapEditor
              value={block.html}
              onChange={(html) => onUpdate(block.id, { html })}
              s3Configured={s3Configured}
              origin="page"
              placeholder="Текст блока…"
            />
          ) : (
            <TextSummary html={block.html} onEdit={onToggle} />
          )
        ) : (
          <>
            <BlockThumb type={block.type} params={block.params} />
            {open && def ? (
              <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2">
                {def.params.map((param) => (
                  <div key={param.key} className="space-y-1.5">
                    <Label htmlFor={`${block.id}-${param.key}`}>
                      {param.label}
                    </Label>
                    <Input
                      id={`${block.id}-${param.key}`}
                      value={block.params[param.key] ?? ""}
                      placeholder={param.placeholder}
                      onChange={(e) =>
                        onUpdate(block.id, {
                          params: {
                            ...block.params,
                            [param.key]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/** Свёрнутый текстовый блок: первые строки без разметки. */
function TextSummary({ html, onEdit }: { html: string; onEdit: () => void }) {
  const plain = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full rounded bg-muted/40 p-3 text-left transition hover:bg-muted/70"
    >
      {plain ? (
        <span className="line-clamp-3 text-sm text-muted-foreground">
          {plain}
        </span>
      ) : (
        <span className="text-sm italic text-muted-foreground">
          Пустой текст — нажмите, чтобы написать
        </span>
      )}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
  active,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  active?: boolean;
  destructive?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-7 w-7",
        active && "bg-primary/10 text-primary",
        destructive && "text-muted-foreground hover:text-destructive",
      )}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
