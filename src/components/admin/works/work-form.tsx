"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";
import { Textarea } from "@/components/ui/textarea";
import { deleteWork, saveWork } from "@/server/actions/admin/works";

export type WorkFormInitial = {
  id?: string;
  title?: string;
  organization?: string | null;
  city?: string | null;
  category?: string | null;
  summary?: string;
  imageUrl?: string | null;
  isPublished?: boolean;
  sort?: number;
  completedAt?: Date | null;
};

function toDateInput(value: Date | null | undefined): string {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}

export function WorkForm({
  mode,
  initial,
  s3Configured,
}: {
  mode: "create" | "edit";
  initial?: WorkFormInitial;
  s3Configured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: initial?.id,
      title: String(fd.get("title") ?? ""),
      organization: String(fd.get("organization") ?? ""),
      city: String(fd.get("city") ?? ""),
      category: String(fd.get("category") ?? ""),
      summary: String(fd.get("summary") ?? ""),
      imageUrl,
      isPublished,
      sort: Number(fd.get("sort") ?? 0),
      completedAt: String(fd.get("completedAt") ?? ""),
    };

    startTransition(async () => {
      const res = await saveWork(payload);
      if (res.ok) {
        toast.success(mode === "create" ? "Работа создана" : "Изменения сохранены");
        if (mode === "create") {
          router.push(`/admin/works/${res.id}`);
        } else {
          router.refresh();
        }
      } else {
        if (res.errors) setErrors(res.errors);
        toast.error(res.message || "Не удалось сохранить");
      }
    });
  }

  async function handleDelete(id: string) {
    const res = await deleteWork(id);
    if (res.ok) router.push("/admin/works");
    return res;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Работа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Название" name="title" required error={errors.title}>
            <Input
              id="title"
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              disabled={pending}
              placeholder="Оснащение операционной под ключ"
            />
          </Field>
          <Field label="Описание" name="summary" required error={errors.summary}>
            <Textarea
              id="summary"
              name="summary"
              required
              rows={7}
              defaultValue={initial?.summary ?? ""}
              disabled={pending}
              placeholder="Что поставили или обслужили, в каком объёме и в какой срок"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Заказчик"
              name="organization"
              error={errors.organization}
            >
              <Input
                id="organization"
                name="organization"
                defaultValue={initial?.organization ?? ""}
                disabled={pending}
              />
            </Field>
            <Field label="Город" name="city" error={errors.city}>
              <Input
                id="city"
                name="city"
                defaultValue={initial?.city ?? ""}
                disabled={pending}
              />
            </Field>
          </div>
          <Field label="Направление" name="category" error={errors.category}>
            <Input
              id="category"
              name="category"
              defaultValue={initial?.category ?? ""}
              disabled={pending}
              placeholder="Поставка · Сервис · Монтаж"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Фотография</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {imageUrl ? (
            <div className="relative inline-flex max-w-xs rounded-md border bg-white p-2">
              <Image
                src={imageUrl}
                alt="Фотография работы"
                width={280}
                height={190}
                className="h-auto w-full object-contain"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                disabled={pending}
                className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-destructive"
                aria-label="Убрать фотографию"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Фотография не выбрана — карточка покажет только текст.
            </p>
          )}
          <MediaPickerDialog
            triggerLabel={imageUrl ? "Заменить фотографию" : "Выбрать или загрузить фотографию"}
            triggerVariant="outline"
            onSelect={(item) => setImageUrl(item.url)}
            s3Configured={s3Configured}
            origin="works"
          />
          {errors.imageUrl ? (
            <p className="text-xs text-destructive">{errors.imageUrl}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Публикация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              disabled={pending}
            />
            <span>
              Показывать на сайте
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Снятая работа остаётся в админке, но пропадает со страницы
                «Наши работы».
              </span>
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Дата завершения"
              name="completedAt"
              error={errors.completedAt}
            >
              <Input
                id="completedAt"
                name="completedAt"
                type="date"
                defaultValue={toDateInput(initial?.completedAt)}
                disabled={pending}
              />
            </Field>
            <Field label="Порядок (меньше — выше)" name="sort" error={errors.sort}>
              <Input
                id="sort"
                name="sort"
                type="number"
                min={0}
                step={1}
                defaultValue={initial?.sort ?? 0}
                disabled={pending}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Создать" : "Сохранить"}
        </Button>
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/admin/works">Отмена</Link>
        </Button>
        {mode === "edit" && initial?.id ? (
          <div className="ml-auto">
            <ConfirmDeleteButton
              id={initial.id}
              variant="destructive"
              size="default"
              label="Удалить"
              description="Работа будет удалена без возможности восстановления."
              onDelete={handleDelete}
            />
          </div>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  error,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
