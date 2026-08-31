import Link from "next/link";
import { notFound } from "next/navigation";

import { RegionForm } from "@/components/admin/regions/region-form";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";
import { defaultRegionIntro, REGIONS_BY_SLUG } from "@/lib/region-pages";

export const dynamic = "force-dynamic";

export const metadata = { title: "Страница региона — Эрфольг" };

export default async function EditRegionPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const region = REGIONS_BY_SLUG.get(params.slug);
  if (!region) notFound();

  // Читаем напрямую, минуя getRegionContent: в админке нужна и
  // неопубликованная запись, и кэш здесь только мешает.
  let row: Awaited<ReturnType<typeof db.regionPage.findUnique>> = null;
  try {
    row = await db.regionPage.findUnique({ where: { slug: params.slug } });
  } catch (e) {
    console.error("edit region fetch error", e);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/regions"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← К списку регионов
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {region.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          /regions/{region.slug} · {region.code}
        </p>
      </div>
      <RegionForm
        initial={{
          slug: region.slug,
          regionName: region.name,
          hasRow: row !== null,
          heading: row?.heading ?? "",
          intro: row?.intro ?? "",
          content: row?.content ?? "",
          seoTitle: row?.seoTitle ?? "",
          seoDesc: row?.seoDesc ?? "",
          isPublished: row?.isPublished ?? true,
          defaultIntro: defaultRegionIntro(),
        }}
        s3Configured={isS3Configured()}
      />
    </div>
  );
}
