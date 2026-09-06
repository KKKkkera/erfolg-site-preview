import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { db } from "@/lib/db";
import { defaultMetadata } from "@/lib/seo";
import { articleSchema, breadcrumbListSchema } from "@/lib/schema";
import { sanitizeCmsHtml } from "@/lib/sanitize-cms";

export const revalidate = 300;

type Params = { slug: string };

async function loadPost(slug: string) {
  try {
    return await db.blogPost.findFirst({
      where: { slug, isPublished: true },
    });
  } catch (error) {
    throw error;
  }
}

async function loadRelated(currentSlug: string) {
  try {
    return await db.blogPost.findMany({
      where: { isPublished: true, NOT: { slug: currentSlug } },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        coverUrl: true,
        publishedAt: true,
      },
    });
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) {
    return defaultMetadata({
      title: "Статья не найдена",
      path: `/blog/${slug}`,
      noindex: true,
    });
  }
  return defaultMetadata({
    // Суффикс « | Erfolg» добавляет шаблон в root layout — прежний фолбэк
    // «… | Erfolg — блог» давал в итоге двойное «| Erfolg».
    title: post.seoTitle ?? post.title,
    description:
      post.seoDesc ?? post.excerpt ?? `${post.title} — статья блога Erfolg.`,
    path: `/blog/${slug}`,
    image: post.coverUrl ?? undefined,
    type: "article",
  });
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();
  const related = await loadRelated(slug);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/blog", label: "Блог" },
          { label: post.title },
        ]}
      />

      <article className="container pb-12">
        <div className="mx-auto max-w-3xl">
          {post.publishedAt ? (
            <time
              dateTime={post.publishedAt.toISOString()}
              className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-flame-ink"
            >
              {formatDate(post.publishedAt)}
            </time>
          ) : null}
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              {post.excerpt}
            </p>
          ) : null}
          {post.authorName ? (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Автор: {post.authorName}
            </p>
          ) : null}

          {post.coverUrl ? (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg border border-border bg-surface">
              <Image
                src={post.coverUrl}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          ) : null}

          <div
            className="prose prose-slate mt-10 max-w-none text-foreground prose-headings:font-sans prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-li:marker:text-flame-ink"
            dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(post.content) }}
          />
        </div>

        {related.length > 0 ? (
          <div className="mt-16 border-t guide-border pt-12">
            <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Ещё статьи
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-colors hover:border-primary/50"
                >
                  {r.coverUrl ? (
                    <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-surface">
                      <Image
                        src={r.coverUrl}
                        alt={r.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    {r.publishedAt ? (
                      <time
                        dateTime={r.publishedAt.toISOString()}
                        className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        {formatDate(r.publishedAt)}
                      </time>
                    ) : null}
                    <h3 className="mt-2 text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {r.title}
                    </h3>
                    {r.excerpt ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {r.excerpt}
                      </p>
                    ) : null}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-medium text-primary">
                      Читать
                      <ChevronRight
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </article>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Блог", url: "/blog" },
          { name: post.title, url: `/blog/${slug}` },
        ])}
      />
      <JsonLd
        data={articleSchema({
          title: post.title,
          description: post.excerpt,
          url: `/blog/${slug}`,
          imageUrl: post.coverUrl,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          authorName: post.authorName,
        })}
      />
    </>
  );
}
