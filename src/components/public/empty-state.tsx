import Link from "next/link";
import { PackageSearch, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LeadDialog } from "@/components/public/lead-dialog";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /**
   * Открыть форму КП прямо здесь вместо перехода на «Контакты».
   * В момент, когда человек ничего не нашёл, лишний переход стоит дорого.
   */
  quoteCta?: { label: string; source: string };
};

/**
 * Пустое состояние «Раздел в разработке» / «Ничего не найдено».
 * Иллюстрация — иконка lucide в рамке-видоискателе.
 */
export function EmptyState({
  icon: Icon = PackageSearch,
  title,
  description,
  cta,
  secondaryCta,
  quoteCta,
}: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-surface/50 px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60"
      >
        NO DATA
      </span>
      <div className="grid h-16 w-16 place-items-center rounded-md border border-border bg-white text-primary">
        <Icon className="h-7 w-7" aria-hidden="true" strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-2.5 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {(cta || secondaryCta || quoteCta) && (
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {quoteCta ? (
            <LeadDialog
              source={quoteCta.source}
              triggerLabel={quoteCta.label}
            />
          ) : null}
          {cta ? (
            <Button asChild>
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ) : null}
          {secondaryCta ? (
            <Button asChild variant="outline">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
