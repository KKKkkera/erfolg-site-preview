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
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";
import {
  deleteBlogPost,
  saveBlogPost,
} from "@/server/actions/admin/blog-posts";
import { slugify } from "@/lib/slugify";

export type BlogPostFormInitial = {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  content?: string;
  coverUrl?: string | null;
  authorName?: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
};

function toDateInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  // YYYY-MM-DDTHH:mm для <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function BlogPostForm({
  mode,
  initial,
  s3Configured,
}: {
  mode: "create" | "edit";
  initial?: BlogPostFormInitial;
  s3Configured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPublished, setIsPublished] = useState<boolean>(
    initial?.isPublished ?? false,
  );
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [slug, setSlug] = useState(initial?.slug ?? "");

  function onTitleChange(value: string) {
    if (!slugTouched && mode === "create") {
      setSlug(slugify(value));
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: initial?.id,
      slug: String(fd.get("slug") ?? slug),
      title: String(fd.get("title") ?? ""),
      excerpt: String(fd.get("excerpt") ?? ""),
      content,
      coverUrl,
      authorName: String(fd.get("authorName") ?? ""),
      isPublished,
      publishedAt: String(fd.get("publishedAt") ?? ""),
      seoTitle: String(fd.get("seoTitle") ?? ""),
      seoDesc: String(fd.get("seoDesc") ?? ""),
    };
    startTransition(async () => {
      const res = await saveBlogPost(payload);
      if (res.ok) {
        toast.success(mode === "create" ? "Статья создана" : "Изменения сохранены");
        if (mode === "create") {
          router.push(`/admin/blog/${res.id}`);
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
    const res = await deleteBlogPost(id);
    if (res.ok) router.push("/admin/blog");
    return res;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Статья</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Заголовок" name="title" required error={errors.title}>
            <Input
              id="title"
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              disabled={pending}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </Field>
          <Field label="Slug" name="slug" required error={errors.slug}>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              disabled={pending}
              placeholder="kak-vybrat-uzi"
            />
          </Field>
          <Field label="Краткое описание" name="excerpt" error={errors.excerpt}>
            <Textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              defaultValue={initial?.excerpt ?? ""}
              disabled={pending}
              placeholder="1–2 предложения. Показывается в списке статей и в анонсах."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Автор"
              name="authorName"
              error={errors.authorName}
            >
              <Input
                id="authorName"
                name="authorName"
                defaultValue={initial?.authorName ?? ""}
                disabled={pending}
                placeholder="Например: Команда Эрфольг"
              />
            </Field>
            <Field
              label="Дата публикации"
              name="publishedAt"
              error={errors.publishedAt}
            >
              <Input
                id="publishedAt"
                name="publishedAt"
                type="datetime-local"
                defaultValue={toDateInputValue(initial?.publishedAt)}
                disabled={pending}
              />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isPublished"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              disabled={pending}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isPublished">Опубликована</Label>
            <span className="text-xs text-muted-foreground">
              {isPublished
                ? "Видна на /blog и в sitemap.xml"
                : "Черновик — на сайте не показывается"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Обложка</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {coverUrl ? (
            <div className="relative inline-block">
              <Image
                src={coverUrl}
                alt="Обложка"
                width={320}
                height={180}
                className="rounded-md border object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setCoverUrl("")}
                disabled={pending}
                className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-destructive"
                aria-label="Убрать обложку"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Обложка не выбрана. Рекомендуется горизонтальное изображение 1200×675.
            </p>
          )}
          <MediaPickerDialog
            triggerLabel={coverUrl ? "Заменить обложку" : "Выбрать из медиатеки"}
            triggerVariant="outline"
            onSelect={(item) => setCoverUrl(item.url)}
            s3Configured={s3Configured}
            origin="blog"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Содержимое</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Текст статьи" name="content" error={errors.content}>
            <TiptapEditor
              value={content}
              onChange={setContent}
              s3Configured={s3Configured}
              origin="blog"
              placeholder="Введите текст статьи…"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title (SEO)" name="seoTitle" error={errors.seoTitle}>
            <Input
              id="seoTitle"
              name="seoTitle"
              defaultValue={initial?.seoTitle ?? ""}
              disabled={pending}
            />
          </Field>
          <Field
            label="Description (SEO)"
            name="seoDesc"
            error={errors.seoDesc}
          >
            <Textarea
              id="seoDesc"
              name="seoDesc"
              rows={2}
              defaultValue={initial?.seoDesc ?? ""}
              disabled={pending}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Создать" : "Сохранить"}
        </Button>
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/admin/blog">Отмена</Link>
        </Button>
        {mode === "edit" && initial?.id ? (
          <div className="ml-auto">
            <ConfirmDeleteButton
              id={initial.id}
              variant="destructive"
              size="default"
              label="Удалить"
              description="Статья будет удалена."
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
