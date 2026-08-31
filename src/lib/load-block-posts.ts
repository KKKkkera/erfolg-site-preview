import { db } from "@/lib/db";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";
import type { PostCard } from "@/components/public/post-carousel";

/* Загрузка статей для блока [[block:posts]].

   Тот же отбор, что и в ленте на главной: только опубликованные, свежие
   сверху. Дата форматируется здесь, на сервере — карусель принимает готовую
   строку, чтобы не разъезжалась гидратация из-за локали клиента. */

const MAX_LIMIT = 9;

function formatBlogDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export async function loadBlockPosts(params: {
  limit?: string;
}): Promise<PostCard[]> {
  const parsed = Number.parseInt(params.limit?.trim() || "", 10);
  const limit =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_LIMIT) : 3;

  try {
    const rows = await withTimeoutFallback(
      db.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: {
          slug: true,
          title: true,
          excerpt: true,
          coverUrl: true,
          publishedAt: true,
        },
      }),
      { fallback: null, label: "block.posts", timeoutMs: 500 },
    );

    if (!rows) return [];

    return rows.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverUrl: post.coverUrl,
      publishedAt: post.publishedAt ? formatBlogDate(post.publishedAt) : null,
      publishedAtIso: post.publishedAt?.toISOString() ?? null,
    }));
  } catch (e) {
    console.error("loadBlockPosts error", e);
    return [];
  }
}
