import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";

export const dynamic = "force-dynamic";

export const metadata = { title: "Редактирование статьи — Эрфольг" };

export default async function EditBlogPostPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  let post: Awaited<ReturnType<typeof db.blogPost.findUnique>> = null;
  try {
    post = await db.blogPost.findUnique({ where: { id: params.id } });
  } catch (e) {
    console.error("edit blog post fetch error", e);
  }
  if (!post) notFound();

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
          {post.title}
        </h1>
        <p className="text-sm text-muted-foreground">/blog/{post.slug}</p>
      </div>
      <BlogPostForm
        mode="edit"
        initial={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverUrl: post.coverUrl,
          authorName: post.authorName,
          isPublished: post.isPublished,
          publishedAt: post.publishedAt,
          seoTitle: post.seoTitle,
          seoDesc: post.seoDesc,
        }}
        s3Configured={isS3Configured()}
      />
    </div>
  );
}
