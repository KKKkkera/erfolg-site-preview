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
import { deleteBrand, saveBrand } from "@/server/actions/admin/brands";
import { slugify } from "@/lib/slugify";

export type BrandFormInitial = {
  id?: string;
  name?: string;
  slug?: string;
  country?: string | null;
  website?: string | null;
};

export function BrandForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: BrandFormInitial;
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
      country: String(fd.get("country") ?? ""),
      website: String(fd.get("website") ?? ""),
    };
    startTransition(async () => {
      const res = await saveBrand(payload);
      if (res.ok) {
        toast.success(mode === "create" ? "Бренд создан" : "Изменения сохранены");
        if (mode === "create") {
          router.push(`/admin/brands/${res.id}`);
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
    const res = await deleteBrand(id);
    if (res.ok) router.push("/admin/brands");
    return res;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Бренд</CardTitle>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Страна" name="country" error={errors.country}>
              <Input
                id="country"
                name="country"
                defaultValue={initial?.country ?? ""}
                disabled={pending}
              />
            </Field>
            <Field label="Сайт" name="website" error={errors.website}>
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={initial?.website ?? ""}
                disabled={pending}
                placeholder="https://"
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
          <Link href="/admin/brands">Отмена</Link>
        </Button>
        {mode === "edit" && initial?.id ? (
          <div className="ml-auto">
            <ConfirmDeleteButton
              id={initial.id}
              variant="destructive"
              size="default"
              label="Удалить"
              description="Бренд будет удалён. Если связаны товары — удаление отменится."
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
