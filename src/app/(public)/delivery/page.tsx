import type { Metadata } from "next";

import { CmsPageContent } from "@/components/public/cms-page-content";
import { JsonLd } from "@/components/seo/json-ld";
import { getCmsPage } from "@/lib/cms";
import { defaultMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema";
import { withTimeoutFallback } from "@/lib/with-timeout-fallback";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await withTimeoutFallback(getCmsPage("delivery"), {
    fallback: null,
    label: "delivery.metadata",
    timeoutMs: 350,
  });
  return defaultMetadata({
    title:
      page?.seoTitle ??
      page?.title ??
      "Доставка медицинского оборудования",
    description:
      page?.seoDesc ??
      "Доставка медицинской техники по всей России: собственный транспорт, ПЭК, СДЭК, «Деловые Линии». Удалённые регионы — индивидуальный расчёт логистики.",
    path: "/delivery",
  });
}

export default async function DeliveryPage() {
  const page = await withTimeoutFallback(getCmsPage("delivery"), {
    fallback: null,
    label: "delivery.page",
    timeoutMs: 350,
  });

  return (
    <>
      <CmsPageContent
        page={page}
        fallbackTitle="Доставка"
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { label: "Доставка" },
        ]}
      >
        <p>
          Доставляем оборудование, расходные материалы и запчасти по всей
          России. Способ доставки выбираем по характеристикам груза:
          габариты, масса, требования к температурному режиму, срок поставки.
          Стоимость доставки фиксируется в КП по каждому заказу.
        </p>
        <p>
          Транспорт: собственный автопарк, ПЭК, СДЭК, «Деловые Линии».
          Для крупногабаритного и стационарного оборудования — выезд
          инженеров на объект для монтажа и пуско-наладки.
        </p>
        <p>
          Для Сибири, Дальнего Востока и районов Крайнего Севера логистика
          рассчитывается индивидуально по факту груза. Точная стоимость
          и срок поставки фиксируются в коммерческом предложении.
        </p>
      </CmsPageContent>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Доставка", url: "/delivery" },
        ])}
      />
    </>
  );
}
