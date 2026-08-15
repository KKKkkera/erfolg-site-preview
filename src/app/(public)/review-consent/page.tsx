import type { Metadata } from "next";

import { CmsPageContent } from "@/components/public/cms-page-content";
import { getCmsPage } from "@/lib/cms";
import { defaultMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("review-consent");
  return defaultMetadata({
    title:
      page?.seoTitle ??
      page?.title ??
      "Согласие на публикацию отзыва — ООО «Эрфольг»",
    description:
      page?.seoDesc ??
      "Текст согласия на публикацию отзыва и персональных данных: перечень публикуемых сведений, цель публикации и порядок отзыва согласия.",
    path: "/review-consent",
  });
}

export default async function ReviewConsentPage() {
  const page = await getCmsPage("review-consent");

  return (
    <CmsPageContent
      page={page}
      fallbackTitle="Согласие на публикацию отзыва и персональных данных"
      breadcrumbs={[
        { href: "/", label: "Главная" },
        { label: "Согласие на публикацию отзыва" },
      ]}
    >
      <p>
        На этой странице размещается текст согласия на публикацию отзыва,
        которое пользователь подтверждает при отправке отзыва через форму на
        сайте.
      </p>
      <p>
        Если основной текст не отобразился, запросите копию документа по адресу{" "}
        <a href="mailto:erfolg-chr@mail.ru">erfolg-chr@mail.ru</a> или{" "}
        <a href="mailto:info@erfolgmt.ru">info@erfolgmt.ru</a>.
      </p>
    </CmsPageContent>
  );
}
