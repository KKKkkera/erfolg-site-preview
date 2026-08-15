import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  HeartPulse,
  Stethoscope,
  Microscope,
  Eye,
  FlaskConical,
  Package,
  Wrench,
  Layers,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ICON_MAP: Record<string, LucideIcon> = {
  reanimation: HeartPulse,
  diagnostics: Stethoscope,
  surgery: Microscope,
  "ophthalmology-ent": Eye,
  laboratory: FlaskConical,
  consumables: Package,
  "spare-parts": Wrench,
};

const CATEGORY_LABEL: Record<string, string> = {
  reanimation: "ICU",
  diagnostics: "DIAG",
  surgery: "OR",
  "ophthalmology-ent": "OPH/ENT",
  laboratory: "LAB",
  consumables: "CONS",
  "spare-parts": "SPARE",
};

type CategoryCardProps = {
  category: {
    slug: string;
    name: string;
    description?: string | null;
  };
  href?: string;
  /** Index for editorial numbering (e.g. 1 → "01") */
  index?: number;
  /** Total count for "01 / 07" suffix */
  total?: number;
};

/**
 * Editorial icon-tile карточка категории.
 * Стиль: technical specsheet — нумерация, mono-метки, крупная иконка.
 * Не использует внешние фото — полностью локально, безопасно для prod-сети.
 */
export function CategoryCard({ category, href, index, total }: CategoryCardProps) {
  const Icon = ICON_MAP[category.slug] ?? Layers;
  const label = CATEGORY_LABEL[category.slug] ?? "CAT";
  const linkHref = href ?? `/catalog/${category.slug}`;
  const numberStr =
    typeof index === "number"
      ? `${String(index).padStart(2, "0")}${
          typeof total === "number" ? ` / ${String(total).padStart(2, "0")}` : ""
        }`
      : null;

  return (
    <Link
      href={linkHref}
      aria-label={`Перейти в раздел ${category.name}`}
      className="group relative block h-[280px] overflow-hidden rounded-lg border border-border bg-white p-6 transition-colors duration-200 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Decorative grid in bottom-right */}
      <svg
        className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 text-primary/[0.04]"
        viewBox="0 0 160 160"
        aria-hidden="true"
      >
        <defs>
          <pattern id={`cat-grid-${category.slug}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="160" height="160" fill={`url(#cat-grid-${category.slug})`} />
      </svg>

      {/* Top row — editorial meta */}
      <div className="relative flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-primary">{label}</span>
        {numberStr ? <span className="opacity-60">{numberStr}</span> : null}
      </div>

      {/* Icon block */}
      <div className="relative mt-8 flex items-center gap-4">
        <div
          className="grid h-16 w-16 place-items-center rounded-lg border border-border bg-secondary/40 transition-colors duration-200 group-hover:border-primary/40 group-hover:bg-primary/[0.06]"
          aria-hidden="true"
        >
          <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
        </div>
        <div className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className="relative mt-6 font-heading text-xl font-semibold leading-tight tracking-tight text-foreground">
        {category.name}
      </h3>

      {/* Bottom row — CTA */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors group-hover:text-primary">
          Перейти в раздел
        </span>
        <ChevronRight
          className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

/**
 * Иконочная карточка категории (легаси-вариант для совместимости).
 * Используется если где-то импортирован CategoryCardIcon.
 */
export function CategoryCardIcon({ category, href }: CategoryCardProps) {
  const Icon = ICON_MAP[category.slug] ?? Layers;
  const linkHref = href ?? `/catalog/${category.slug}`;
  return (
    <Card className="group rounded-xl border-border shadow-card transition-shadow hover:shadow-card-hover">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="font-heading text-lg font-semibold leading-snug">
            {category.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {category.description ? (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {category.description}
          </p>
        ) : null}
        <Link
          href={linkHref}
          className="inline-flex items-center text-sm font-medium text-primary"
        >
          Перейти в раздел
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
