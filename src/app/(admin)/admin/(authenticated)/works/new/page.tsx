import Link from "next/link";

import { WorkForm } from "@/components/admin/works/work-form";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Новая работа — Эрфольг" };

export default function NewWorkPage() {
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
          Новая работа
        </h1>
      </div>
      <WorkForm mode="create" s3Configured={isS3Configured()} />
    </div>
  );
}
