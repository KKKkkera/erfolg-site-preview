import type { Metadata } from "next";

import { CmsPageContent } from "@/components/public/cms-page-content";
import { RevokeConsentButton } from "@/components/public/cookie-banner";
import { getCmsPage } from "@/lib/cms";
import { FORMS_DISABLED } from "@/lib/feature-flags";
import { defaultMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("cookie-policy");
  return defaultMetadata({
    title:
      page?.seoTitle ??
      page?.title ??
      "Политика использования cookie — ООО «Эрфольг»",
    description:
      page?.seoDesc ??
      "Информация об использовании файлов cookie на сайте erfolgmt.ru.",
    path: "/cookie-policy",
  });
}

export default async function CookiePolicyPage() {
  const page = await getCmsPage("cookie-policy");

  return (
    <>
      <CmsPageContent
        page={page}
        fallbackTitle="Политика использования cookie"
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { label: "Политика cookie" },
        ]}
      >
        <p>
          На этой странице размещаются правила использования cookie-файлов,
          цели обработки и способы управления согласием на аналитические cookie.
        </p>
        <p>
          Если основной текст не отобразился, запросите копию документа по адресу{" "}
          <a href="mailto:erfolg-chr@mail.ru">erfolg-chr@mail.ru</a> или <a href="mailto:info@erfolgmt.ru">info@erfolgmt.ru</a>.
        </p>
      </CmsPageContent>

      {/* В тихом режиме cookie не ставятся и баннера нет — отзывать нечего,
          кнопка вводила бы посетителя в заблуждение. */}
      {FORMS_DISABLED ? null : (
        <section className="rails container -mt-8 max-w-3xl pb-16">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Управление согласием
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Если вы хотите изменить решение по аналитическим cookie, нажмите
              кнопку ниже — текущее согласие будет очищено, и баннер появится
              заново при следующей навигации.
            </p>
            <div className="mt-4">
              <RevokeConsentButton />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
