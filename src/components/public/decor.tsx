import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Декор-набор дизайн-системы «Инженерный паспорт».
 * Все компоненты серверные и чисто презентационные.
 */

/** Mono-ярлык секции: оранжевый индекс + подпись (декоративное тире убрано) */
export function SectionTag({
  index,
  children,
  className,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("tech-label flex items-center gap-3 text-muted-foreground", className)}>
      {index ? <span className="text-flame-ink">{index}</span> : null}
      <span>{children}</span>
    </p>
  );
}

/**
 * ЭКГ-линия — сквозной мотив из логотипа (пульс в шестерёнке).
 * Тянется по ширине контейнера; цвет — через text-*.
 */
export function PulseLine({
  className,
  animated = false,
  strokeWidth = 2,
}: {
  className?: string;
  animated?: boolean;
  /* Толщина в единицах viewBox. preserveAspectRatio="none" сплющивает линию
     по-разному по осям, поэтому при малой высоте (подчёркивание в заголовке)
     штрих нужно задирать, иначе горизонтали уходят в доли пикселя. */
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("block h-8 w-full text-flame", className)}
    >
      <path
        className={animated ? "ecg-draw" : undefined}
        d="M0 30 H60 L72 22 84 30 H110 L118 34 130 4 142 56 150 30 H186 L204 20 222 30 H360 L372 22 384 30 H410 L418 34 430 4 442 56 450 30 H486 L504 20 522 30 H660 L672 22 684 30 H710 L718 34 730 4 742 56 750 30 H786 L804 20 822 30 H960 L972 22 984 30 H1010 L1018 34 1030 4 1042 56 1050 30 H1086 L1104 20 1122 30 H1200"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Уголки-скобки «видоискателя» для спец-карточек */
export function CornerBrackets({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 text-flame", className)}
    >
      <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-current" />
      <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-current" />
      <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-current" />
      <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-current" />
    </span>
  );
}

/** Крупная цифра-показатель: Unbounded + mono-подпись */
export function Stat({
  value,
  label,
  className,
  dark = false,
}: {
  value: string;
  label: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div
        className={cn(
          "font-heading text-3xl font-semibold leading-none tracking-tight md:text-4xl",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "mt-2.5 font-mono text-[0.6875rem] font-medium uppercase leading-4 tracking-[0.14em]",
          dark ? "text-ink-muted" : "text-muted-foreground",
        )}
      >
        {label}
      </div>
    </div>
  );
}
