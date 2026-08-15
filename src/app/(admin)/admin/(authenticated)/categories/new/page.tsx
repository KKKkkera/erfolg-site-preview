import Link from "next/link";

import { CategoryForm } from "@/components/admin/categories/category-form";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Новая категория — Эрфольг" };

export default async function NewCategoryPage() {
  let parents: { id: string; name: string }[] = [];
  try {
    parents = await db.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.error("new category fetch error", e);
  }
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
          Новая категория
        </h1>
      </div>
      <CategoryForm mode="create" parents={parents} />
    </div>
  );
}
