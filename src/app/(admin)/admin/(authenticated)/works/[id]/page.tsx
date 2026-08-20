import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkForm } from "@/components/admin/works/work-form";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Работа — Эрфольг" };

export default async function AdminWorkPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const work = await db.work.findUnique({ where: { id } }).catch((e: unknown) => {
    console.error("work fetch error", e);
    return null;
  });

  if (!work) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/works"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← К списку работ
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {work.title}
        </h1>
      </div>
      <WorkForm
        mode="edit"
        s3Configured={isS3Configured()}
        initial={{
          id: work.id,
          title: work.title,
          organization: work.organization,
          city: work.city,
          category: work.category,
          summary: work.summary,
          imageUrl: work.imageUrl,
          isPublished: work.isPublished,
          sort: work.sort,
          completedAt: work.completedAt,
        }}
      />
    </div>
  );
}
