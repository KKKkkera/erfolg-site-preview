import type { Metadata } from "next";

import { CmsPageContent } from "@/components/public/cms-page-content";
import { getCmsPage } from "@/lib/cms";
import { defaultMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("personal-data-policy");
  return defaultMetadata({
    title:
      page?.seoTitle ??
      page?.title ??
      "Политика обработки персональных данных — ООО «Эрфольг»",
    description:
      page?.seoDesc ??
      "Политика обработки персональных данных в соответствии с 152-ФЗ.",
    path: "/personal-data-policy",
  });
}

export default async function PersonalDataPolicyPage() {
  const page = await getCmsPage("personal-data-policy");

  return (
    <CmsPageContent
      page={page}
      fallbackTitle="Политика обработки персональных данных"
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { label: "Политика обработки ПДн" },
      ]}
    >
      <p>
        На этой странице публикуется действующая редакция Политики обработки
        персональных данных ООО «Эрфольг» в соответствии с требованиями 152-ФЗ.
      </p>
      <p>
        Если основной текст не отобразился, запросите копию документа по адресу{" "}
        <a href="mailto:erfolg-chr@mail.ru">erfolg-chr@mail.ru</a> или <a href="mailto:info@erfolgmt.ru">info@erfolgmt.ru</a>.
      </p>
    </CmsPageContent>
  );
}
