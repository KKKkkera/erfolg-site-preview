import Link from "next/link";

import { PageForm } from "@/components/admin/pages/page-form";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Новая страница — Эрфольг" };

export default function NewPagePage() {
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
          Новая страница
        </h1>
      </div>
      <PageForm mode="create" s3Configured={isS3Configured()} />
    </div>
  );
}
