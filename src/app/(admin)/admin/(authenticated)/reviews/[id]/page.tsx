import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewForm } from "@/components/admin/reviews/review-form";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Отзыв — Эрфольг" };

export default async function AdminReviewPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const review = await db.review
    .findUnique({ where: { id } })
    .catch((e: unknown) => {
      console.error("review fetch error", e);
      return null;
    });

  if (!review) notFound();

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
          Отзыв: {review.authorName}
        </h1>
      </div>
      <ReviewForm
        mode="edit"
        s3Configured={isS3Configured()}
        initial={{
          id: review.id,
          authorName: review.authorName,
          position: review.position,
          organization: review.organization,
          city: review.city,
          text: review.text,
          rating: review.rating,
          imageUrl: review.imageUrl,
          isPublished: review.isPublished,
          sort: review.sort,
          publishedAt: review.publishedAt,
        }}
      />
    </div>
  );
}
