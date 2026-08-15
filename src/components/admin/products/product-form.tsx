"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import {
  ProductImagesEditor,
  type ProductImageItem,
} from "@/components/admin/products/product-images-editor";
import { deleteProduct, saveProduct } from "@/server/actions/admin/products";
import { slugify } from "@/lib/slugify";

type Option = { id: string; name: string };

export type ProductFormInitial = {
  id?: string;
  name?: string;
  slug?: string;
  sku?: string | null;
  model?: string | null;
  brandId?: string | null;
  categoryId?: string;
  kind?: "EQUIPMENT" | "CONSUMABLE" | "SPARE_PART";
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  shortDesc?: string | null;
  fullDesc?: string | null;
  regNumber?: string | null;
  regDate?: string | null;
  regUrl?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  sort?: number;
  images?: ProductImageItem[];
};

export function ProductForm({
  mode,
  initial,
  categories,
  brands,
  s3Configured,
}: {
  mode: "create" | "edit";
  initial?: ProductFormInitial;
  categories: Option[];
  brands: Option[];
  s3Configured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [fullDesc, setFullDesc] = useState(initial?.fullDesc ?? "");

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
      sku: String(fd.get("sku") ?? ""),
      model: String(fd.get("model") ?? ""),
      brandId: String(fd.get("brandId") ?? ""),
      categoryId: String(fd.get("categoryId") ?? ""),
      kind: String(fd.get("kind") ?? "EQUIPMENT") as
        | "EQUIPMENT"
        | "CONSUMABLE"
        | "SPARE_PART",
      status: String(fd.get("status") ?? "DRAFT") as
        | "DRAFT"
        | "ACTIVE"
        | "ARCHIVED",
      shortDesc: String(fd.get("shortDesc") ?? ""),
      fullDesc,
      regNumber: String(fd.get("regNumber") ?? ""),
      regDate: String(fd.get("regDate") ?? ""),
      regUrl: String(fd.get("regUrl") ?? ""),
      seoTitle: String(fd.get("seoTitle") ?? ""),
      seoDesc: String(fd.get("seoDesc") ?? ""),
      sort: Number(fd.get("sort") ?? 0),
    };

    startTransition(async () => {
      const res = await saveProduct(payload);
      if (res.ok) {
        toast.success(mode === "create" ? "Товар создан" : "Изменения сохранены");
        if (mode === "create") {
          router.push(`/admin/products/${res.id}`);
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
    const res = await deleteProduct(id);
    if (res.ok) {
      router.push("/admin/products");
    }
    return res;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Основное</CardTitle>
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
              <Field label="Slug (часть URL)" name="slug" error={errors.slug}>
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Если оставить пустым, slug сгенерируется из названия.
                </p>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SKU / артикул" name="sku" error={errors.sku}>
                  <Input
                    id="sku"
                    name="sku"
                    defaultValue={initial?.sku ?? ""}
                    disabled={pending}
                  />
                </Field>
                <Field label="Модель" name="model" error={errors.model}>
                  <Input
                    id="model"
                    name="model"
                    defaultValue={initial?.model ?? ""}
                    disabled={pending}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Категория"
                  name="categoryId"
                  required
                  error={errors.categoryId}
                >
                  <select
                    id="categoryId"
                    name="categoryId"
                    defaultValue={initial?.categoryId ?? ""}
                    required
                    disabled={pending}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">— Выберите —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Бренд" name="brandId" error={errors.brandId}>
                  <select
                    id="brandId"
                    name="brandId"
                    defaultValue={initial?.brandId ?? ""}
                    disabled={pending}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Без бренда</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Тип" name="kind" error={errors.kind}>
                  <select
                    id="kind"
                    name="kind"
                    defaultValue={initial?.kind ?? "EQUIPMENT"}
                    disabled={pending}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="EQUIPMENT">Оборудование</option>
                    <option value="CONSUMABLE">Расходник</option>
                    <option value="SPARE_PART">Запчасть</option>
                  </select>
                </Field>
                <Field label="Статус" name="status" error={errors.status}>
                  <select
                    id="status"
                    name="status"
                    defaultValue={initial?.status ?? "DRAFT"}
                    disabled={pending}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="DRAFT">Черновик</option>
                    <option value="ACTIVE">Опубликован</option>
                    <option value="ARCHIVED">Архив</option>
                  </select>
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Описание</CardTitle>
              <CardDescription>
                Краткое — для карточки в каталоге, полное — для страницы товара.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Краткое описание"
                name="shortDesc"
                error={errors.shortDesc}
              >
                <Textarea
                  id="shortDesc"
                  name="shortDesc"
                  rows={3}
                  defaultValue={initial?.shortDesc ?? ""}
                  disabled={pending}
                  placeholder="Несколько строк, отображается в карточке товара"
                />
              </Field>
              <Field
                label="Полное описание"
                name="fullDesc"
                error={errors.fullDesc}
              >
                <TiptapEditor
                  value={fullDesc}
                  onChange={setFullDesc}
                  s3Configured={s3Configured}
                  origin="product"
                  placeholder="Опишите товар, добавьте характеристики, ссылки и изображения"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Регистрационное удостоверение Росздравнадзора
              </CardTitle>
              <CardDescription>
                Обязательно для опубликованных товаров (медизделия).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Номер РУ" name="regNumber" error={errors.regNumber}>
                  <Input
                    id="regNumber"
                    name="regNumber"
                    defaultValue={initial?.regNumber ?? ""}
                    disabled={pending}
                    placeholder="ФСЗ 2012/12345"
                  />
                </Field>
                <Field label="Дата выдачи" name="regDate" error={errors.regDate}>
                  <Input
                    id="regDate"
                    name="regDate"
                    type="date"
                    defaultValue={initial?.regDate ?? ""}
                    disabled={pending}
                  />
                </Field>
              </div>
              <Field
                label="Ссылка на запись в реестре"
                name="regUrl"
                error={errors.regUrl}
              >
                <Input
                  id="regUrl"
                  name="regUrl"
                  type="url"
                  defaultValue={initial?.regUrl ?? ""}
                  disabled={pending}
                  placeholder="https://roszdravnadzor.gov.ru/..."
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Сортировка</CardTitle>
            </CardHeader>
            <CardContent>
              <Field label="Sort (число)" name="sort" error={errors.sort}>
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
              <CardTitle className="text-base">Изображения</CardTitle>
              <CardDescription>
                {mode === "create"
                  ? "Доступно после создания товара."
                  : "Перетаскивайте для сортировки. Первое — главное."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mode === "edit" && initial?.id ? (
                <ProductImagesEditor
                  productId={initial.id}
                  initial={initial.images ?? []}
                  s3Configured={s3Configured}
                />
              ) : (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Сначала сохраните товар — затем добавите фото.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Создать" : "Сохранить"}
        </Button>
        <Button asChild type="button" variant="outline" disabled={pending}>
          <Link href="/admin/products">Отмена</Link>
        </Button>
        {mode === "edit" && initial?.id ? (
          <div className="ml-auto">
            <ConfirmDeleteButton
              id={initial.id}
              variant="destructive"
              size="default"
              label="Удалить"
              description="Товар будет удалён без возможности восстановления."
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
