import { Phone, Mail, Headphones } from "lucide-react";

import { MAINTENANCE_CONTACT } from "@/lib/feature-flags";

type FormsDisabledNoticeProps = {
  variant?: "default" | "compact";
  title?: string;
  description?: string;
};

/**
 * Канал связи на время, пока онлайн-формы временно недоступны.
 * Не собирает ПДн — только статичная информация со способами связи.
 */
export function FormsDisabledNotice({
  variant = "default",
  title = "Заявки принимаем по телефону и e-mail",
  description = "Для быстрого расчёта позвоните или напишите менеджеру — отвечаем в рабочий день. КП по электронной почте готовим за 1–2 дня.",
}: FormsDisabledNoticeProps) {
  const compact = variant === "compact";

  return (
    <div
      className={
        compact
          ? "rounded-lg border border-[#dfeafb] bg-[#f4f8ff] p-4 text-sm dark:border-sky-900/40 dark:bg-sky-950/20"
          : "rounded-xl border border-[#dfeafb] bg-[#f4f8ff] p-6 dark:border-sky-900/40 dark:bg-sky-950/20"
      }
      role="status"
    >
      <div className="flex items-start gap-3">
        <Headphones
          className={
            compact
              ? "mt-0.5 h-5 w-5 flex-shrink-0 text-primary"
              : "mt-1 h-6 w-6 flex-shrink-0 text-primary"
          }
          aria-hidden="true"
        />
        <div className="flex-1 space-y-3">
          <div>
            <h3
              className={
                compact
                  ? "font-heading text-sm font-semibold text-foreground"
                  : "font-heading text-base font-semibold text-foreground"
              }
            >
              {title}
            </h3>
            <p
              className={
                compact
                  ? "mt-1 text-xs text-muted-foreground"
                  : "mt-1.5 text-sm text-muted-foreground"
              }
            >
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <a
              href={MAINTENANCE_CONTACT.phoneHref}
              className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {MAINTENANCE_CONTACT.phone}
            </a>
            <a
              href={MAINTENANCE_CONTACT.emailHref}
              className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {MAINTENANCE_CONTACT.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
