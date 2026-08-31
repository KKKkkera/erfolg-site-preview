"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  className?: string;
  /** Классы картинки: управляют высотой (h-9, h-10 и т.д.) */
  imgClassName?: string;
  /** Логотип в шапке — выше сгиба, грузим с приоритетом */
  priority?: boolean;
  /* Легаси-пропсы текстового логотипа: принимаются и игнорируются,
     чтобы старые вызовы не падали по типам. */
  subtitleClassName?: string;
  titleClassName?: string;
  markClassName?: string;
  showSubtitle?: boolean;
};

/**
 * Фирменный логотип Erfolg Medical Engineering (PNG с прозрачностью).
 * Размер задаётся классами картинки: h-9/h-10 + w-auto.
 */
export function BrandLogo({
  href = "/",
  className,
  imgClassName,
  priority = false,
}: BrandLogoProps) {
  const pathname = usePathname();

  /* Клик по логотипу на той же странице, куда он ведёт, навигацию не
     вызывает — Next видит тот же маршрут и ничего не делает, страница
     остаётся прокрученной. Поэтому прокручиваем наверх сами. */
  const isCurrent = pathname === href;

  return (
    <Link
      href={href}
      onClick={
        isCurrent
          ? (e) => {
              e.preventDefault();
              window.scrollTo({ top: 0 });
            }
          : undefined
      }
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label="Erfolg — на главную"
    >
      <Image
        src="/brand/erfolg-logo.png"
        alt="Erfolg Medical Engineering"
        width={621}
        height={200}
        sizes="140px"
        priority={priority}
        className={cn("h-10 w-auto", imgClassName)}
      />
    </Link>
  );
}
