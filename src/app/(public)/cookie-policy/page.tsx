import type { Metadata } from "next";

import { CmsPageContent } from "@/components/public/cms-page-content";
import { getCmsPage } from "@/lib/cms";
import { defaultMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("cookie-policy");
  return defaultMetadata({
    title:
      page?.seoTitle ??
      page?.title ??
      "Согласие на обработку файлов cookies — ООО «Эрфольг»",
    description:
      page?.seoDesc ??
      "Текст согласия на обработку файлов cookies на сайте erfolgmt.ru: категории файлов, цели, сроки и порядок отзыва.",
    path: "/cookie-policy",
  });
}

export default async function CookiePolicyPage() {
  const page = await getCmsPage("cookie-policy");

  return (
    <CmsPageContent
      page={page}
      fallbackTitle="Согласие на обработку файлов cookies"
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { label: "Согласие на обработку файлов cookies" },
      ]}
    >
      <p>
        На этой странице размещается текст согласия на обработку файлов
        cookies: категории файлов, цели обработки, сроки и порядок отзыва
        согласия.
      </p>
      <p>
        Если основной текст не отобразился, запросите копию документа по адресу{" "}
        <a href="mailto:erfolg-chr@mail.ru">erfolg-chr@mail.ru</a> или <a href="mailto:info@erfolgmt.ru">info@erfolgmt.ru</a>.
      </p>
    </CmsPageContent>
  );
}
