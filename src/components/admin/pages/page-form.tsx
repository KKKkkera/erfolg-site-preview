"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
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
import {
  hasPublicCmsRoute,
  isCodeManagedCmsSlug,
} from "@/lib/public-routes";
import { deletePage, savePage } from "@/server/actions/admin/pages";

export type PageFormInitial = {
  id?: string;
  slug?: string;
  title?: string;
  content?: string;
  seoTitle?: string | null;
  seoDesc?: string | null;
  isPublished?: boolean;
  sort?: number;
};

export function PageForm({
  mode,
  initial,
  s3Configured,
}: {
  mode: "create" | "edit";
  initial?: PageFormInitial;
  s3Configured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPublished, setIsPublished] = useState<boolean>(
    initial?.isPublished ?? true,
  );
  const [content, setContent] = useState(initial?.content ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");

  const slugTrimmed = slug.trim();
  const codeManaged = isCodeManagedCmsSlug(slugTrimmed);
  const noRoute = slugTrimmed !== "" && !hasPublicCmsRoute(slugTrimmed);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: initial?.id,
      slug: String(fd.get("slug") ?? ""),
      title: String(fd.get("title") ?? ""),
      content,
      seoTitle: String(fd.get("seoTitle") ?? ""),
      seoDesc: String(fd.get("seoDesc") ?? ""),
      isPublished,
      sort: Number(fd.get("sort") ?? 0),
    };
    startTransition(async () => {
      const res = await savePage(payload);
      if (res.ok) {
        toast.success(mode === "create" ? "Страница создана" : "Изменения сохранены");
        if (mode === "create") {
          router.push(`/admin/pages/${res.id}`);
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
    const res = await deletePage(id);
    if (res.ok) router.push("/admin/pages");
    return res;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {codeManaged ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-medium">Контент этой страницы управляется кодом</p>
          <p className="mt-1 text-muted-foreground">
            Текст для «{slugTrimmed}» рендерится из{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              src/lib/static-cms-pages.ts
            </code>{" "}
            (юридические формулировки зависят от режима сайта). Правки,
            сохранённые здесь, на сайте <strong>не появятся</strong> — меняйте
            текст в коде.
          </p>
        </div>
      ) : noRoute ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-medium">Для этого slug нет маршрута на сайте</p>
          <p className="mt-1 text-muted-foreground">
            Страница сохранится в базе, но по адресу /{slugTrimmed} будет 404:
            динамического рендера произвольных CMS-страниц в проекте нет.
            Список допустимых slug — в{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              src/lib/public-routes.ts
            </code>
            .
          </p>
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Страница</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Заголовок" name="title" required error={errors.title}>
            <Input
              id="title"
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              disabled={pending}
            />
          </Field>
          <Field label="Slug" name="slug" required error={errors.slug}>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={pending}
              placeholder="delivery"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort" name="sort" error={errors.sort}>
              <Input
                id="sort"
                name="sort"
                type="number"
                defaultValue={initial?.sort ?? 0}
                disabled={pending}
              />
            </Field>
            <div className="flex items-center gap-2 pt-7">
              <input
                id="isPublished"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                disabled={pending}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isPublished">Опубликована</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Содержимое</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Контент" name="content" error={errors.content}>
            <TiptapEditor
              value={content}
              onChange={setContent}
              s3Configured={s3Configured}
              origin="page"
              placeholder="Введите содержимое страницы…"
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
          <Link href="/admin/pages">Отмена</Link>
        </Button>
        {mode === "edit" && initial?.id ? (
          <div className="ml-auto">
            <ConfirmDeleteButton
              id={initial.id}
              variant="destructive"
              size="default"
              label="Удалить"
              description="Страница будет удалена."
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
