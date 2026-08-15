import Link from "next/link";
import { notFound } from "next/navigation";

import { PageForm } from "@/components/admin/pages/page-form";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Редактирование страницы — Эрфольг" };

export default async function EditPagePage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  let page: Awaited<ReturnType<typeof db.page.findUnique>> = null;
  try {
    page = await db.page.findUnique({ where: { id: params.id } });
  } catch (e) {
    console.error("edit page fetch error", e);
  }
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/pages"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← К списку страниц
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {page.title}
        </h1>
        <p className="text-sm text-muted-foreground">/{page.slug}</p>
      </div>
      <PageForm
        mode="edit"
        initial={{
          id: page.id,
          slug: page.slug,
          title: page.title,
          content: page.content,
          seoTitle: page.seoTitle,
          seoDesc: page.seoDesc,
          isPublished: page.isPublished,
          sort: page.sort,
        }}
        s3Configured={isS3Configured()}
      />
    </div>
  );
}
