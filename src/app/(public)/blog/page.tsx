import Link from "next/link";
import Image from "next/image";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import { JsonLd } from "@/components/seo/json-ld";
import { db, isDatabaseConfigured } from "@/lib/db";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 300;

export const metadata = defaultMetadata({
  title: "Блог — статьи о медтехнике, сервисе и поставке",
  description:
    "Гайды по подбору и закупке медицинского оборудования, объяснение 44/223-ФЗ, регистрационных удостоверений и техобслуживания. Опыт поставщика с 2012 года.",
  path: "/blog",
});

type BlogPostListItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  authorName: string | null;
  publishedAt: Date | null;
};

async function loadPosts(): Promise<BlogPostListItem[]> {
  if (!isDatabaseConfigured) {
    return [];
  }

  const rows = await withTimeoutFallback(
    db.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        coverUrl: true,
        authorName: true,
        publishedAt: true,
      },
    }),
    { fallback: [] as BlogPostListItem[], label: "blog.list", timeoutMs: 1000 },
  );
  return rows;
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function BlogIndexPage() {
  const posts = await loadPosts();

  return (
    <>
      <Breadcrumbs items={[{ href: "/", label: "Главная" }, { label: "Блог" }]} />

      <section className="rails container pb-16">
        <div className="max-w-3xl">
          <SectionTag>Блог</SectionTag>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            Блог о медицинской технике
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Статьи о подборе оборудования, госзакупках по 44/223-ФЗ,
            регистрационных удостоверениях, лизинге и техническом обслуживании.
            Пишем по своему сервису и поставкам с 2012 года.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-input bg-surface/50 p-10 text-center text-sm leading-6 text-muted-foreground">
            Скоро здесь появятся статьи. Подпишитесь на рассылку
            или подайте запрос на КП — пока готовим материалы.
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, idx) => (
              <article
                key={post.slug}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-colors hover:border-primary/50"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-surface">
                    {post.coverUrl ? (
                      <Image
                        src={post.coverUrl}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Erfolg
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    {post.publishedAt ? (
                      <time
                        dateTime={post.publishedAt.toISOString()}
                        className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                      >
                        {formatDate(post.publishedAt)}
                      </time>
                    ) : null}
                    <span aria-hidden="true" className="font-mono text-[11px] font-medium text-flame-ink">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h2 className="mt-2.5 text-lg font-semibold leading-snug tracking-tight text-foreground">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="transition-colors hover:text-primary"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {post.excerpt}
                    </p>
                  ) : null}
                  {post.authorName ? (
                    <p className="mt-auto border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
                      Автор: {post.authorName}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Блог", url: "/blog" },
        ])}
      />
    </>
  );
}
