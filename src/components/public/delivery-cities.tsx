import deliveryIcon from "../../../public/images/icons/delivery-truck.png";
import logisticsIcon from "../../../public/images/icons/logistics-calc.png";
import installIcon from "../../../public/images/icons/install-tools.png";

import { RegionCoverage } from "@/components/public/region-coverage";

/* Общие условия географии: раньше жили под каруселью, теперь — под картой. */
const COVERAGE_BULLETS = [
  {
    icon: deliveryIcon,
    text: "Доставка по всей России — собственный транспорт, ПЭК, СДЭК, «Деловые Линии». Способ доставки выбираем по габаритам, массе и сроку поставки.",
  },
  {
    icon: logisticsIcon,
    text: "В Сибирь, на Дальний Восток и районы Крайнего Севера — индивидуальный расчёт логистики по факту груза, со сроком и стоимостью в КП.",
  },
  {
    icon: installIcon,
    text: "Для крупногабаритного и стационарного оборудования — монтаж и пуско-наладка силами наших инженеров на объекте.",
  },
];

export function DeliveryCities() {
  return (
    <section className="rails rails-over border-t guide-border bg-white">
      <div className="marks marks-t container py-14 md:py-16">
        <div className="mx-auto max-w-[46rem] text-center">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.8rem] md:text-[2.1rem]">
            Работаем по всей России
          </h2>
          <p className="mx-auto mt-4 max-w-[38rem] text-base leading-6 text-muted-foreground sm:leading-7">
            Регион на условия и сроки в большинстве случаев не влияет —
            поставляем оборудование и выезжаем на сервис во все федеральные
            округа
          </p>
        </div>

        <RegionCoverage />

        {/* На телефоне пункты идут строками «иконка — текст»: колонкой по
            центру каждый из них занимал полэкрана. */}
        <ul className="mt-10 grid gap-6 md:mt-12 md:grid-cols-3 md:gap-8">
          {COVERAGE_BULLETS.map((item) => (
            <li
              key={item.text}
              className="flex items-start gap-4 md:flex-col md:items-center md:gap-0 md:text-center"
            >
              {/* PNG перекрашивается в фирменный цвет через mask */}
              <span
                aria-hidden
                className="h-10 w-10 shrink-0 bg-flame-ink md:h-14 md:w-14"
                style={{
                  maskImage: `url(${item.icon.src})`,
                  WebkitMaskImage: `url(${item.icon.src})`,
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                }}
              />
              <p className="max-w-[22rem] text-sm leading-6 text-foreground/85 md:mt-4 md:leading-7">
                {item.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
