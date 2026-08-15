"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  clearConsent,
  readConsent,
  subscribeConsent,
  writeConsent,
} from "@/lib/consent";

function isLocalPreview(): boolean {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

/**
 * Cookie-баннер 152-ФЗ.
 *
 * Логика:
 *  - Состояние «выбор сделан» читается из localStorage[`cookie-consent`]
 *    через useSyncExternalStore (см. lib/consent.ts); если ключа нет —
 *    баннер показывается. На SSR и на localhost баннер скрыт.
 *  - «Принять все» → `accepted` + analytics:true.
 *  - «Только необходимые» → `rejected` + analytics:false.
 *  - «Настройки» открывает Dialog с переключателем для аналитических cookie
 *    (необходимые всегда включены, чекбокс задизейблен).
 *  - writeConsent диспатчит `CustomEvent('cookie-consent-changed')` — от него
 *    перерисовывается и этот баннер (скрывается), и компонент Я.Метрики
 *    (см. seo/yandex-metrika.tsx), который подгружает или не подгружает счётчик.
 *
 * Кнопка «Отозвать согласие» внутри страницы /cookie-policy очищает ключ — после
 * этого баннер появится заново без перезагрузки страницы.
 */
export function CookieBanner() {
  const decided = useSyncExternalStore(
    subscribeConsent,
    () => isLocalPreview() || readConsent() !== null,
    // На сервере баннер скрыт, чтобы не моргал при гидрации.
    () => true,
  );
  const [open, setOpen] = useState(false);

  if (decided) return null;

  return (
    // role="region", а не "dialog": баннер не модальный (страница остаётся
    // интерактивной), а dialog без aria-modal и focus-trap нарушает ARIA.
    // Регион с aria-live анонсируется скринридером при появлении.
    <div
      role="region"
      aria-label="Использование cookie"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      {/* /[.96], а не /96: нестандартный шаг прозрачности не генерируется
          Tailwind, и баннер оставался без белой подложки. */}
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-white/[.96] p-4 shadow-card-hover backdrop-blur sm:p-5">
        <div className="flex items-start gap-3">
          <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface sm:grid">
            <Cookie
              className="h-5 w-5 text-flame-ink"
              aria-hidden="true"
            />
          </div>
          <div className="flex-1">
            <p className="font-heading text-sm font-semibold text-foreground sm:text-base">
              Cookie на сайте erfolgmt.ru
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Мы используем cookie для работы сайта и аналитики. Аналитические
              cookie активируются только после вашего согласия. Подробнее в{" "}
              <Link
                href="/cookie-policy"
                className="text-primary underline-offset-2 hover:underline"
              >
                Политике cookie
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <SettingsButton open={open} setOpen={setOpen} />
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              writeConsent("rejected", { necessary: true, analytics: false })
            }
          >
            Только необходимые
          </Button>
          <Button
            type="button"
            onClick={() =>
              writeConsent("accepted", { necessary: true, analytics: true })
            }
          >
            Принять все
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingsButton({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [analytics, setAnalytics] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost">
          Настройки
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Настройки cookie</DialogTitle>
          <DialogDescription>
            Выберите категории cookie, которые вы разрешаете. Настройки можно
            изменить позже на странице{" "}
            <Link
              href="/cookie-policy"
              className="text-primary underline-offset-2 hover:underline"
            >
              Политика cookie
            </Link>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <CategoryRow
            title="Необходимые"
            description="Сессии, защита от CSRF, запоминание выбора в этом баннере. Без них сайт не работает."
            checked
            disabled
          />
          <CategoryRow
            title="Аналитические"
            description="Яндекс.Метрика — обезличенные данные о поведении для оценки качества сайта."
            checked={analytics}
            onChange={setAnalytics}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              writeConsent("rejected", { necessary: true, analytics: false });
              setOpen(false);
            }}
          >
            Отклонить все
          </Button>
          <Button
            type="button"
            onClick={() => {
              writeConsent(analytics ? "accepted" : "rejected", {
                necessary: true,
                analytics,
              });
              setOpen(false);
            }}
          >
            Сохранить выбор
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onChange?.(v === true)}
        className="mt-0.5"
      />
      <span className="flex-1 text-sm">
        <span className="block font-medium text-foreground">{title}</span>
        <span className="mt-1 block text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

/**
 * Кнопка «Отозвать согласие» — для размещения внутри страницы /cookie-policy.
 * Очищает ключи в localStorage, диспатчит событие — баннер появляется заново.
 */
export function RevokeConsentButton() {
  const [revoked, setRevoked] = useState(false);

  function handleClick() {
    clearConsent();
    setRevoked(true);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="outline" onClick={handleClick}>
        Отозвать согласие на cookie
      </Button>
      {revoked ? (
        <p className="text-xs text-success">
          Согласие отозвано. Баннер снова показан внизу страницы.
        </p>
      ) : null}
    </div>
  );
}
