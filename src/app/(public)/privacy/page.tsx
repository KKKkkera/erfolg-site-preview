import type { Metadata } from "next";

import { CmsPageContent } from "@/components/public/cms-page-content";
import { getCmsPage } from "@/lib/cms";
import { defaultMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("privacy");
  return defaultMetadata({
    title:
      page?.seoTitle ??
      page?.title ??
      "Политика конфиденциальности — ООО «Эрфольг»",
    description:
      page?.seoDesc ??
      "Политика конфиденциальности сайта erfolgmt.ru. Принципы обработки персональных данных.",
    path: "/privacy",
  });
}

export default async function PrivacyPage() {
  const page = await getCmsPage("privacy");

  return (
    <CmsPageContent
      page={page}
      fallbackTitle="Политика конфиденциальности"
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { label: "Политика конфиденциальности" },
      ]}
    >
      <p>
        На этой странице размещается действующая редакция политики
        конфиденциальности сайта и краткие правила работы с персональными
        данными пользователей.
      </p>
      <p>
        Если основной текст не отобразился, запросите актуальную редакцию
        документа по адресу <a href="mailto:erfolg-chr@mail.ru">erfolg-chr@mail.ru</a> или <a href="mailto:info@erfolgmt.ru">info@erfolgmt.ru</a>.
      </p>
    </CmsPageContent>
  );
}
