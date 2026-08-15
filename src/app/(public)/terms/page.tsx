import type { Metadata } from "next";

import { CmsPageContent } from "@/components/public/cms-page-content";
import { getCmsPage } from "@/lib/cms";
import { defaultMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("terms");
  return defaultMetadata({
    title:
      page?.seoTitle ?? page?.title ?? "Пользовательское соглашение — ООО «Эрфольг»",
    description:
      page?.seoDesc ??
      "Условия использования сайта erfolgmt.ru: статус информации, медицинские изделия, интеллектуальные права, ограничение ответственности.",
    path: "/terms",
  });
}

export default async function TermsPage() {
  const page = await getCmsPage("terms");

  return (
    <CmsPageContent
      page={page}
      fallbackTitle="Пользовательское соглашение"
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { label: "Пользовательское соглашение" },
      ]}
    >
      <p>
        На этой странице размещается действующая редакция условий использования
        сайта erfolgmt.ru.
      </p>
      <p>
        Если основной текст не отобразился, запросите актуальную редакцию
        документа по адресу{" "}
        <a href="mailto:info@erfolgmt.ru">info@erfolgmt.ru</a>.
      </p>
    </CmsPageContent>
  );
}
