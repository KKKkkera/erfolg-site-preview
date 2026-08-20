"use client";

import Link from "next/link";
import { useState } from "react";

import {
  RUSSIA_REGIONS,
  RUSSIA_VIEWBOX,
  type RussiaRegion,
} from "./russia-map-regions";

/* Карта регионов РФ: каждый регион — группа контуров (материк плюс его острова),
   поэтому Курилы подсвечиваются вместе с Сахалином, а Земля Франца-Иосифа —
   с Архангельской областью. При наведении показываем название, по клику ведём
   на страницу региона.
   Тот же набор контуров лежит отдельным файлом: public/maps/russia-regions.svg,
   и переносимым пакетом: packages/russia-regions-map. */
export function RussiaMap({ className }: { className?: string }) {
  const [hovered, setHovered] = useState<RussiaRegion | null>(null);

  return (
    <div className={className}>
      <svg
        viewBox={RUSSIA_VIEWBOX}
        role="img"
        aria-label="Карта России: поставляем оборудование во все регионы"
        className="block h-auto w-full"
        onPointerLeave={() => setHovered(null)}
      >
        {RUSSIA_REGIONS.map((region) => (
          <Link
            key={region.code}
            href={`/regions/${region.slug}`}
            aria-label={region.name}
            className="outline-none"
            onPointerEnter={() => setHovered(region)}
            onFocus={() => setHovered(region)}
            onBlur={() => setHovered(null)}
          >
            <title>{region.name}</title>
            {region.paths.map((d, pathIndex) => (
              <path
                key={pathIndex}
                d={d}
                fillRule="evenodd"
                clipRule="evenodd"
                stroke="#fff"
                strokeWidth={1.4}
                strokeLinejoin="round"
                className={
                  hovered?.code === region.code
                    ? "cursor-pointer fill-flame transition-[fill] duration-200 ease-out"
                    : "cursor-pointer fill-[hsl(206_18%_38%/0.18)] transition-[fill] duration-200 ease-out"
                }
              />
            ))}
          </Link>
        ))}
      </svg>

      {/* Подпись под картой, а не всплывающая у курсора: не прыгает и одинаково
          читается на тач-устройствах, где ховера нет. */}
      <p
        aria-live="polite"
        className="mt-4 min-h-[1.75rem] text-center font-mono text-[13px] uppercase tracking-[0.12em] text-flame-ink"
      >
        {hovered ? hovered.name : ""}
      </p>
    </div>
  );
}
