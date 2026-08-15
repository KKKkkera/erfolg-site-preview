import { ShieldCheck, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hasRealRegNumber } from "@/lib/reg-number";

type RegBadgeProduct = {
  regNumber?: string | null;
  regUrl?: string | null;
  regDate?: Date | string | null;
};

const ROSZDRAVNADZOR_SEARCH = "https://roszdravnadzor.gov.ru/services/misearch";

/**
 * Блок с регистрационным удостоверением Росздравнадзора.
 * Не рендерится, если у товара нет regNumber или там стоит заглушка.
 *
 * Варианты:
 *  - compact: только щит + номер РУ (для карточки в сетке)
 *  - default: щит + номер + ссылки «Проверить в реестре» / «Открыть запись»
 */
export function RegBadge({
  product,
  compact = false,
}: {
  product: RegBadgeProduct;
  compact?: boolean;
}) {
  if (!hasRealRegNumber(product?.regNumber)) return null;

  if (compact) {
    return (
      <span
        className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-primary/25 bg-primary/[.06] px-2 py-1 font-mono text-xs text-foreground"
        title="Регистрационное удостоверение Росздравнадзора"
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">РУ {product.regNumber}</span>
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-primary/25 bg-primary/[.05] p-4 text-sm">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold text-foreground">
            Регистрационное удостоверение Росздравнадзора
          </p>
          <p className="mt-1.5 text-foreground">
            №{" "}
            <code className="break-all rounded-sm border border-border bg-white px-1.5 py-0.5 font-mono text-xs">
              {product.regNumber}
            </code>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={ROSZDRAVNADZOR_SEARCH}
                target="_blank"
                rel="noopener noreferrer"
              >
                Проверить в реестре
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
            {product.regUrl ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={product.regUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Открыть запись в реестре
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
