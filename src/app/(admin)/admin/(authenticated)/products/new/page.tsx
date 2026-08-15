import Link from "next/link";

import { ProductForm } from "@/components/admin/products/product-form";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Новый товар — Эрфольг" };

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = [];
  let brands: { id: string; name: string }[] = [];
  try {
    [categories, brands] = await Promise.all([
      db.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.brand.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (e) {
    console.error("new product page fetch error", e);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← К списку товаров
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Новый товар
        </h1>
      </div>
      <ProductForm
        mode="create"
        categories={categories}
        brands={brands}
        s3Configured={isS3Configured()}
      />
    </div>
  );
}
