"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Check, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FORMS_DISABLED } from "@/lib/feature-flags";
import { FormsDisabledNotice } from "@/components/public/forms-disabled-notice";
import { PhoneInput } from "@/components/public/phone-input";
import { cn } from "@/lib/utils";
import {
  submitLeadRequest,
  type LeadFormState,
} from "@/server/actions/lead-request";

const initialState: LeadFormState = { ok: false };

const FIELD =
  "h-[3.375rem] w-full border border-border bg-white px-5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary sm:text-sm";

const NAME_MAX = 50;
const EMAIL_MAX = 160;
const MESSAGE_MAX = 500;

/** В имени оставляем только буквы, пробел, дефис и апостроф. */
const NOT_NAME = /[^\p{L}\s'’-]/gu;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="accent"
      disabled={pending}
      className="h-[3rem] w-full text-[0.9375rem]"
    >
      {pending ? "Отправка…" : label}
    </Button>
  );
}

export type LeadFormProps = {
  /** Товар, из карточки которого открыта форма. */
  productId?: string;
  /** Метка источника заявки — по ней заявки различаются в админке. */
  source?: string;
  submitLabel?: string;
  className?: string;
};

/**
 * Единственная форма обратной связи на сайте: имя, телефон, комментарий.
 * Используется и в модалке, и врезкой в страницы.
 */
export function LeadForm(props: LeadFormProps) {
  if (FORMS_DISABLED) {
    return <FormsDisabledNotice variant="compact" />;
  }
  return <LeadFormInner {...props} />;
}

function LeadFormInner({
  productId,
  source = "site",
  submitLabel = "Отправить заявку",
  className,
}: LeadFormProps) {
  const [state, formAction] = useActionState(submitLeadRequest, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Заявка отправлена");
      formRef.current?.reset();
    } else if (state.message) {
      // Текст ошибки — тостом, в самой форме от красных подписей отказались:
      // проблемное поле показывает только красная рамка.
      toast.error(state.message);
    }
  }, [state]);

  if (state.ok) {
    return (
      <div className="border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2
          className="mx-auto h-10 w-10 text-success"
          aria-hidden="true"
        />
        <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
          Заявка принята
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {state.message ?? "Менеджер свяжется с вами в ближайшее время."}
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className={cn("space-y-3", className)}
      noValidate
    >
      {productId ? (
        <input type="hidden" name="productId" value={productId} />
      ) : null}
      <input type="hidden" name="source" value={source} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] -top-[9999px] h-0 w-0 opacity-0"
      />

      <input
        name="name"
        type="text"
        required
        maxLength={NAME_MAX}
        autoComplete="name"
        aria-label="Ваше имя"
        placeholder="Ваше имя"
        value={name}
        onChange={(event) =>
          setName(event.target.value.replace(NOT_NAME, "").slice(0, NAME_MAX))
        }
        className={cn(FIELD, state.errors?.name && "border-destructive")}
      />

      <PhoneInput required invalid={Boolean(state.errors?.phone)} />

      <input
        name="email"
        type="email"
        maxLength={EMAIL_MAX}
        autoComplete="email"
        aria-label="Ваша почта"
        placeholder="example@mail.ru"
        className={cn(FIELD, state.errors?.email && "border-destructive")}
      />

      <div>
        <textarea
          name="message"
          rows={4}
          maxLength={MESSAGE_MAX}
          aria-label="Ваш комментарий"
          placeholder="Ваш комментарий"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MESSAGE_MAX))}
          className={cn(FIELD, "h-auto min-h-[6.875rem] resize-none overscroll-contain py-3.5 leading-6")}
        />
        <div className="mt-1 text-right text-xs tabular-nums text-muted-foreground/70">
          {message.length}/{MESSAGE_MAX}
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-[0.6875rem] leading-4 text-foreground">
        {/* Без aria-label: он перекрывал имя от родительского label, и
            скринридер не озвучивал ссылки на согласие и политику ПДн */}
        <input
          type="checkbox"
          name="consent"
          required
          defaultChecked={false}
          className="peer sr-only"
        />
        {/* Своя рамка вместо системного чекбокса: у нативного скруглённые
            углы, а система построена на прямых. Галочка белая всегда —
            на белом фоне невыбранного состояния её просто не видно. */}
        <span
          aria-hidden="true"
          className={cn(
            "mt-px flex h-4 w-4 shrink-0 items-center justify-center border transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1",
            state.errors?.consent
              ? "border-destructive bg-destructive/10"
              : "border-border bg-white",
          )}
        >
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
        <span>
          Я даю свое{" "}
          <Link
            href="/consent"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Согласие на обработку моих персональных данных
          </Link>{" "}
          в соответствии с{" "}
          <Link
            href="/personal-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Политикой конфиденциальности
          </Link>
          .
        </span>
      </label>

      <div className="pt-1">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
