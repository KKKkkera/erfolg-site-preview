import type { Metadata } from "next";

import { CmsPageContent } from "@/components/public/cms-page-content";
import { JsonLd } from "@/components/seo/json-ld";
import { getCmsPage } from "@/lib/cms";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await withTimeoutFallback(getCmsPage("warranty"), {
    fallback: null,
    label: "warranty.metadata",
    timeoutMs: 350,
  });
  return defaultMetadata({
    title:
      page?.seoTitle ??
      page?.title ??
      "Гарантия и сервисная поддержка",
    description:
      page?.seoDesc ??
      "Гарантия производителя на поставляемое медицинское оборудование. Сервисная поддержка в гарантийный период — по лицензии Росздравнадзора (ТОМИ).",
    path: "/warranty",
  });
}

export default async function WarrantyPage() {
  const page = await withTimeoutFallback(getCmsPage("warranty"), {
    fallback: null,
    label: "warranty.page",
    timeoutMs: 350,
  });

  return (
    <>
      <CmsPageContent
        page={page}
        fallbackTitle="Гарантия"
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { label: "Гарантия" },
        ]}
      >
        <p>
          На поставляемое оборудование распространяется гарантия производителя.
          Конкретные условия и сроки указываются в товаросопроводительных
          документах и коммерческом предложении по каждому изделию.
        </p>
        <p>
          Сервисная поддержка в гарантийный период осуществляется силами ООО
          «Эрфольг» на основании лицензии Росздравнадзора на техническое
          обслуживание медицинских изделий (ТОМИ). Подробнее — в разделе{" "}
          <a href="/service">«Сервис»</a>.
        </p>
        <p>
          Для оформления гарантийной заявки укажите модель, серийный номер
          и описание неисправности. Заявку можно отправить через форму на
          странице «Сервис» или по телефону / e-mail из раздела «Контакты».
        </p>
      </CmsPageContent>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Гарантия", url: "/warranty" },
        ])}
      />
    </>
  );
}
