import Link from "next/link";

import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Новая статья — Эрфольг" };

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/blog"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← К списку статей
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Новая статья
        </h1>
      </div>
      <BlogPostForm mode="create" s3Configured={isS3Configured()} />
    </div>
  );
}
