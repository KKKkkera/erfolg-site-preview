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
import { deleteReview, saveReview } from "@/server/actions/admin/reviews";

export type ReviewFormInitial = {
  id?: string;
  authorName?: string;
  position?: string | null;
  organization?: string | null;
  city?: string | null;
  text?: string;
  rating?: number | null;
  imageUrl?: string | null;
  isPublished?: boolean;
  sort?: number;
  publishedAt?: Date | null;
};

function toDateInput(value: Date | null | undefined): string {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}

export function ReviewForm({
  mode,
  initial,
  s3Configured,
}: {
  mode: "create" | "edit";
  initial?: ReviewFormInitial;
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
    const ratingRaw = String(fd.get("rating") ?? "").trim();
    const payload = {
      id: initial?.id,
      authorName: String(fd.get("authorName") ?? ""),
      position: String(fd.get("position") ?? ""),
      organization: String(fd.get("organization") ?? ""),
      city: String(fd.get("city") ?? ""),
      text: String(fd.get("text") ?? ""),
      rating: ratingRaw ? Number(ratingRaw) : null,
      imageUrl,
      isPublished,
      sort: Number(fd.get("sort") ?? 0),
      publishedAt: String(fd.get("publishedAt") ?? ""),
    };

    startTransition(async () => {
      const res = await saveReview(payload);
      if (res.ok) {
        toast.success(mode === "create" ? "Отзыв создан" : "Изменения сохранены");
        if (mode === "create") {
          router.push(`/admin/reviews/${res.id}`);
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
    const res = await deleteReview(id);
    if (res.ok) router.push("/admin/reviews");
    return res;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Текст отзыва</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Отзыв" name="text" required error={errors.text}>
            <Textarea
              id="text"
              name="text"
              required
              rows={8}
              defaultValue={initial?.text ?? ""}
              disabled={pending}
              placeholder="Текст отзыва так, как он будет показан на сайте"
            />
          </Field>
          <Field
            label="Оценка (1–5, необязательно)"
            name="rating"
            error={errors.rating}
          >
            <Input
              id="rating"
              name="rating"
              type="number"
              min={1}
              max={5}
              step={1}
              defaultValue={initial?.rating ?? ""}
              disabled={pending}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Скан письма</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {imageUrl ? (
            <div className="relative inline-flex max-w-xs rounded-md border bg-white p-2">
              <Image
                src={imageUrl}
                alt="Скан благодарственного письма"
                width={220}
                height={310}
                className="h-auto w-full object-contain"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                disabled={pending}
                className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-destructive"
                aria-label="Убрать скан"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Скан не выбран — карточка покажет только текст отзыва.
            </p>
          )}
          <MediaPickerDialog
            triggerLabel={imageUrl ? "Заменить скан" : "Выбрать или загрузить скан"}
            triggerVariant="outline"
            onSelect={(item) => setImageUrl(item.url)}
            s3Configured={s3Configured}
            origin="reviews"
          />
          {errors.imageUrl ? (
            <p className="text-xs text-destructive">{errors.imageUrl}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Автор</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Имя"
              name="authorName"
              required
              error={errors.authorName}
            >
              <Input
                id="authorName"
                name="authorName"
                required
                defaultValue={initial?.authorName ?? ""}
                disabled={pending}
              />
            </Field>
            <Field label="Должность" name="position" error={errors.position}>
              <Input
                id="position"
                name="position"
                defaultValue={initial?.position ?? ""}
                disabled={pending}
                placeholder="главный врач"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Организация"
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
                Снятый отзыв остаётся в админке, но пропадает со страницы
                отзывов и с главной.
              </span>
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Дата отзыва"
              name="publishedAt"
              error={errors.publishedAt}
            >
              <Input
                id="publishedAt"
                name="publishedAt"
                type="date"
                defaultValue={toDateInput(initial?.publishedAt)}
                disabled={pending}
              />
            </Field>
            <Field
              label="Порядок (меньше — выше)"
              name="sort"
              error={errors.sort}
            >
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
          <Link href="/admin/reviews">Отмена</Link>
        </Button>
        {mode === "edit" && initial?.id ? (
          <div className="ml-auto">
            <ConfirmDeleteButton
              id={initial.id}
              variant="destructive"
              size="default"
              label="Удалить"
              description="Отзыв будет удалён без возможности восстановления."
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
