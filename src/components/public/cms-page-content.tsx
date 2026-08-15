import type { ReactNode } from "react";

import { Breadcrumbs, type BreadcrumbsItem } from "@/components/public/breadcrumbs";
import { SectionTag } from "@/components/public/decor";
import type { CmsPage } from "@/lib/cms";
import { sanitizeCmsHtml } from "@/lib/sanitize-cms";

type CmsPageContentProps = {
  page: CmsPage | null;
  fallbackTitle: string;
  breadcrumbs: BreadcrumbsItem[];
  children?: ReactNode; // дефолтный контент, если БД пуста
  intro?: ReactNode; // блок над или вместо CMS-контента (например, плейсхолдер «Документ в разработке»)
};

/**
 * Универсальная разметка для страниц-CMS: прозрачно рендерит контент из БД
 * через `dangerouslySetInnerHTML` (доверенный контент из админки), либо
 * fallback-children, если БД недоступна / страница не опубликована.
 */
export function CmsPageContent({
  page,
  fallbackTitle,
  breadcrumbs,
  children,
  intro,
}: CmsPageContentProps) {
  // Ярлык раздела — родительская крошка (обычно «Главная» → берём последнюю
  // промежуточную, а при её отсутствии — нейтральную подпись).
  const parentCrumb =
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : undefined;

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <section className="container pb-16">
        <div className="max-w-3xl">
          <SectionTag>
            {parentCrumb && parentCrumb.label !== "Главная"
              ? parentCrumb.label
              : "Erfolg · документация"}
          </SectionTag>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            {page?.title ?? fallbackTitle}
          </h1>

          {intro ? <div className="mt-4">{intro}</div> : null}

          {page?.content ? (
            <div
              className="prose prose-slate mt-7 max-w-none text-foreground prose-headings:font-sans prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-li:marker:text-flame-ink"
              dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(page.content) }}
            />
          ) : (
            <div className="mt-7 space-y-4 text-base leading-7 text-muted-foreground">
              {children}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
