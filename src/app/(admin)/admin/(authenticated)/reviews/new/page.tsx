import Link from "next/link";

import { ReviewForm } from "@/components/admin/reviews/review-form";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Новый отзыв — Эрфольг" };

export default function NewReviewPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/reviews"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← К списку отзывов
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Новый отзыв
        </h1>
      </div>
      <ReviewForm mode="create" s3Configured={isS3Configured()} />
    </div>
  );
}
