import { Construction, Phone, Mail } from "lucide-react";

import { FORMS_DISABLED, MAINTENANCE_CONTACT } from "@/lib/feature-flags";

/**
 * Верхний баннер «сайт в разработке».
 * Рендерится только при FORMS_DISABLED, чтобы посетитель сразу понимал
 * текущий статус сайта и видел альтернативные каналы связи.
 */
export function MaintenanceBanner() {
  if (!FORMS_DISABLED) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="container mx-auto flex flex-col items-start gap-2 px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:gap-4 sm:text-sm">
        <div className="flex items-start gap-2 sm:items-center">
          <Construction
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-400 sm:mt-0"
            aria-hidden="true"
          />
          <span className="font-medium text-foreground">
            Сайт в процессе доработки.{" "}
            <span className="font-normal text-muted-foreground">
              Онлайн-заявки временно приостановлены — для связи используйте
              телефон или email.
            </span>
          </span>
        </div>
        <div className="flex flex-wrap gap-3 sm:ml-auto">
          <a
            href={MAINTENANCE_CONTACT.phoneHref}
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {MAINTENANCE_CONTACT.phone}
          </a>
          <a
            href={MAINTENANCE_CONTACT.emailHref}
            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {MAINTENANCE_CONTACT.email}
          </a>
        </div>
      </div>
    </div>
  );
}
