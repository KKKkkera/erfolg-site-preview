"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { RegionPicker } from "@/components/public/region-picker";

/* География работы: на десктопе — интерактивная карта, на телефоне — список
   регионов с поиском.

   Карта грузится отдельным чанком и только когда экран действительно широкий:
   контуры 86 регионов весят порядка 130 КБ, и телефону они не нужны — там
   вместо них выбор региона списком, а сама карта остаётся картинкой. */
const RussiaMap = dynamic(
  () => import("@/components/public/russia-map").then((m) => m.RussiaMap),
  { ssr: false },
);

/** С этой ширины карта крупная настолько, что регион можно выбрать мышью. */
const MAP_MEDIA_QUERY = "(min-width: 1024px)";

export function RegionCoverage() {
  const [mapUsable, setMapUsable] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MAP_MEDIA_QUERY);
    const sync = () => setMapUsable(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <>
      {/* Место под карту держим соотношением сторон: подгрузка чанка не должна
          дёргать вёрстку. */}
      <div className="mt-10 hidden lg:block">
        <div className="mx-auto aspect-[1920/1000] w-full max-w-[68rem]">
          {mapUsable ? <RussiaMap className="h-auto w-full" /> : null}
        </div>
      </div>

      <div className="mt-8 lg:hidden">
        {/* Карта на телефоне — только фон: тыкать в контуры размером с букву
            нельзя, а узнаваемость страницы она держит. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/home-v2/russia-map-static.webp"
          alt=""
          aria-hidden="true"
          width={760}
          height={396}
          loading="lazy"
          decoding="async"
          className="mx-auto block h-auto w-full max-w-[34rem] opacity-70"
        />

        <RegionPicker className="mt-6" />
      </div>
    </>
  );
}
