import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/categories/category-form";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Редактирование категории — Эрфольг" };

export default async function EditCategoryPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  let category: Awaited<ReturnType<typeof db.category.findUnique>> = null;
  let parents: { id: string; name: string }[] = [];
  try {
    [category, parents] = await Promise.all([
      db.category.findUnique({ where: { id: params.id } }),
      db.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (e) {
    console.error("edit category fetch error", e);
  }

  if (!category) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/categories"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← К списку категорий
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {category.name}
        </h1>
        <p className="text-sm text-muted-foreground">/{category.slug}</p>
      </div>
      <CategoryForm
        mode="edit"
        initial={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          parentId: category.parentId,
          sort: category.sort,
        }}
        parents={parents}
      />
    </div>
  );
}
