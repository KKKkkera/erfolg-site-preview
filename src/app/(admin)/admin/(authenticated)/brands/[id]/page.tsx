import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandForm } from "@/components/admin/brands/brand-form";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Редактирование бренда — Эрфольг" };

export default async function EditBrandPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  let brand: Awaited<ReturnType<typeof db.brand.findUnique>> = null;
  try {
    brand = await db.brand.findUnique({ where: { id: params.id } });
  } catch (e) {
    console.error("edit brand fetch error", e);
  }
  if (!brand) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/brands"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← К списку брендов
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {brand.name}
        </h1>
        <p className="text-sm text-muted-foreground">/{brand.slug}</p>
      </div>
      <BrandForm
        mode="edit"
        initial={{
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          country: brand.country,
          website: brand.website,
          logo: brand.logo,
          sort: brand.sort,
        }}
        s3Configured={isS3Configured()}
      />
    </div>
  );
}
