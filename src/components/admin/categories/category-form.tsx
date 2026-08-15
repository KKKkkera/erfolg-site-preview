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
import { deleteCategory, saveCategory } from "@/server/actions/admin/categories";
import { slugify } from "@/lib/slugify";

type Option = { id: string; name: string };

export type CategoryFormInitial = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  sort?: number;
};

export function CategoryForm({
  mode,
  initial,
  parents,
}: {
  mode: "create" | "edit";
  initial?: CategoryFormInitial;
  parents: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  function onNameChange(value: string) {
    setName(value);
    if (mode === "create" && !slugTouched) {
      setSlug(slugify(value));
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: initial?.id,
      name: String(fd.get("name") ?? ""),
      slug: String(fd.get("slug") ?? ""),
      description: String(fd.get("description") ?? ""),
      parentId: String(fd.get("parentId") ?? ""),
      seoTitle: String(fd.get("seoTitle") ?? ""),
      seoDesc: String(fd.get("seoDesc") ?? ""),
      sort: Number(fd.get("sort") ?? 0),
    };
    startTransition(async () => {
      const res = await saveCategory(payload);
      if (res.ok) {
        toast.success(mode === "create" ? "Категория создана" : "Изменения сохранены");
        if (mode === "create") {
          router.push(`/admin/categories/${res.id}`);
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
    const res = await deleteCategory(id);
    if (res.ok) {
      router.push("/admin/categories");
    }
    return res;
  }

  const filteredParents = parents.filter((p) => p.id !== initial?.id);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Категория</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Название" name="name" required error={errors.name}>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field label="Slug" name="slug" error={errors.slug}>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              disabled={pending}
              placeholder="auto"
            />
          </Field>
          <Field
            label="Родительская категория"
            name="parentId"
            error={errors.parentId}
          >
            <select
              id="parentId"
              name="parentId"
              defaultValue={initial?.parentId ?? ""}
              disabled={pending}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Без родителя</option>
              {filteredParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Описание" name="description" error={errors.description}>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={initial?.description ?? ""}
              disabled={pending}
            />
          </Field>
          <Field label="Sort" name="sort" error={errors.sort}>
            <Input
              id="sort"
              name="sort"
              type="number"
              defaultValue={initial?.sort ?? 0}
              disabled={pending}
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
          <Link href="/admin/categories">Отмена</Link>
        </Button>
        {mode === "edit" && initial?.id ? (
          <div className="ml-auto">
            <ConfirmDeleteButton
              id={initial.id}
              variant="destructive"
              size="default"
              label="Удалить"
              description="Категория будет удалена. Если в ней есть товары — удаление будет отменено."
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
