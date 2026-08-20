import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/products/product-form";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Редактирование товара — Эрфольг" };

export default async function EditProductPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  type ProductBase = NonNullable<
    Awaited<ReturnType<typeof db.product.findUnique>>
  >;
  type ProductImageRow = {
    id: string;
    url: string;
    alt: string | null;
    sort: number;
  };
  type ProductWithImages = ProductBase & { images: ProductImageRow[] };

  let product: ProductWithImages | null = null;
  let categories: { id: string; name: string }[] = [];
  let brands: { id: string; name: string }[] = [];
  try {
    const [p, cats, br] = await Promise.all([
      db.product.findUnique({
        where: { id: params.id },
        include: { images: { orderBy: { sort: "asc" } } },
      }),
      db.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.brand.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    product = p as ProductWithImages | null;
    categories = cats;
    brands = br;
  } catch (e) {
    console.error("edit product fetch error", e);
  }

  if (!product) notFound();

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
          {product.name}
        </h1>
        <p className="text-sm text-muted-foreground">/{product.slug}</p>
      </div>
      <ProductForm
        mode="edit"
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          model: product.model,
          brandId: product.brandId,
          categoryId: product.categoryId,
          kind: product.kind,
          status: product.status,
          shortDesc: product.shortDesc,
          fullDesc: product.fullDesc,
          regNumber: product.regNumber,
          regDate: product.regDate
            ? product.regDate.toISOString().slice(0, 10)
            : null,
          regValidUntil: product.regValidUntil
            ? product.regValidUntil.toISOString().slice(0, 10)
            : null,
          regAuthority: product.regAuthority,
          regUrl: product.regUrl,
          markingRequired: product.markingRequired,
          markingCodes: product.markingCodes,
          seoTitle: product.seoTitle,
          seoDesc: product.seoDesc,
          sort: product.sort,
          showOnHome: product.showOnHome,
          homeSort: product.homeSort,
          homeBadge: product.homeBadge,
          images: product.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            sort: img.sort,
          })),
        }}
        categories={categories}
        brands={brands}
        s3Configured={isS3Configured()}
      />
    </div>
  );
}
