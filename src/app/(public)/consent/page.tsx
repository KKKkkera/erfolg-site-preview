import type { Metadata } from "next";

import { CmsPageContent } from "@/components/public/cms-page-content";
import { getCmsPage } from "@/lib/cms";
import { defaultMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("consent");
  return defaultMetadata({
    title:
      page?.seoTitle ??
      page?.title ??
      "Согласие на обработку персональных данных — ООО «Эрфольг»",
    description:
      page?.seoDesc ??
      "Текст согласия на обработку персональных данных в соответствии с 152-ФЗ.",
    path: "/consent",
  });
}

export default async function ConsentPage() {
  const page = await getCmsPage("consent");

  return (
    <CmsPageContent
      page={page}
      fallbackTitle="Согласие на обработку персональных данных"
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { label: "Согласие на обработку персональных данных" },
      ]}
    >
      <p>
        На этой странице размещается текст согласия на обработку персональных
        данных, которое пользователь подтверждает при отправке форм на сайте.
      </p>
      <p>
        Если основной текст не отобразился, запросите копию документа по адресу{" "}
        <a href="mailto:erfolg-chr@mail.ru">erfolg-chr@mail.ru</a> или <a href="mailto:info@erfolgmt.ru">info@erfolgmt.ru</a>.
      </p>
    </CmsPageContent>
  );
}
