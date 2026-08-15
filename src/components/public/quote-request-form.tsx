"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FORMS_DISABLED } from "@/lib/feature-flags";
import { FormsDisabledNotice } from "@/components/public/forms-disabled-notice";
import {
  submitQuoteRequest,
  type QuoteFormState,
} from "@/server/actions/quote-request";

const initialState: QuoteFormState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Отправка…" : "Отправить заявку"}
    </Button>
  );
}

export function QuoteRequestForm(props: {
  productId?: string;
  source?: string;
  compact?: boolean;
}) {
  if (FORMS_DISABLED) {
    return <FormsDisabledNotice variant={props.compact ? "compact" : "default"} />;
  }
  return <QuoteRequestFormInner {...props} />;
}

function QuoteRequestFormInner({
  productId,
  source = "site",
  compact = false,
}: {
  productId?: string;
  source?: string;
  compact?: boolean;
}) {
  const [state, formAction] = useFormState(submitQuoteRequest, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Заявка отправлена");
      formRef.current?.reset();
    } else if (state.message && !state.errors) {
      toast.error(state.message);
    }
  }, [state]);

  if (state.ok) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2
          className="mx-auto h-10 w-10 text-success"
          aria-hidden="true"
        />
        <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
          Заявка принята
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {state.message ??
            "Ответим в рабочий день. КП с ценой и сроком поставки пришлём на указанную почту за 1–2 рабочих дня."}
        </p>
      </div>
    );
  }

  // encType не указываем: для Server Action React сам отправляет
  // multipart/form-data, а явный атрибут он перетирает с предупреждением
  // в консоли.
  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
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

      <div className={compact ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <Field
          name="name"
          label="Имя"
          required
          placeholder="Иван Петров"
          error={state.errors?.name}
        />
        <Field
          name="email"
          type="email"
          label="Email"
          required
          placeholder="example@company.ru"
          error={state.errors?.email}
        />
        <Field
          name="phone"
          type="tel"
          label="Телефон"
          optional
          placeholder="+7 (___) ___-__-__"
          error={state.errors?.phone}
        />
        <Field
          name="organization"
          label="Организация"
          optional
          placeholder="ГБУЗ / ООО / ИП"
          error={state.errors?.organization}
        />
        <Field
          name="inn"
          label="ИНН"
          optional
          placeholder="10 или 12 цифр"
          error={state.errors?.inn}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Что нужно</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Модель или тип оборудования, количество, желаемый срок, адрес поставки."
        />
        {state.errors?.message ? (
          <p className="text-xs text-destructive">{state.errors.message}</p>
        ) : null}
      </div>

      <AttachmentField error={state.errors?.attachments} />

      <ConsentField error={state.errors?.consent} />

      {state.message && state.errors ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  optional = false,
  placeholder,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        {optional ? (
          <span className="ml-1 text-xs text-muted-foreground">(необязательно)</span>
        ) : null}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={
          name === "name"
            ? "name"
            : name === "phone"
              ? "tel"
              : name === "email"
                ? "email"
                : name === "organization"
                  ? "organization"
                  : undefined
        }
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/**
 * Поле вложения. Сайт четырежды приглашает прислать ТЗ, спецификацию конкурса
 * или фото идентификационной таблички — до этого приложить их было некуда,
 * и закупщик с готовым ТЗ уходил искать почтовый адрес.
 */
export function AttachmentField({ error }: { error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="attachments">
        Техническое задание или фото
        <span className="ml-1 text-xs text-muted-foreground">(необязательно)</span>
      </Label>
      <Input
        id="attachments"
        name="attachments"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.heic"
        className="h-auto cursor-pointer py-2 file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
      />
      <p className="text-xs leading-5 text-muted-foreground">
        PDF, DOC, XLS, JPG или PNG. До 5 файлов, каждый не больше 10 МБ.
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function ConsentField({ error }: { error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-start gap-2 text-sm text-foreground">
        {/* Без aria-label: он перекрывал имя от родительского label, и
            скринридер не озвучивал ссылки на согласие и политику ПДн */}
        <input
          type="checkbox"
          name="consent"
          required
          defaultChecked={false}
          className="mt-1 h-4 w-4 rounded border-border accent-primary"
        />
        <span>
          Я даю{" "}
          <Link
            href="/consent"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            согласие на обработку персональных данных
          </Link>{" "}
          и подтверждаю, что ознакомлен с{" "}
          <Link
            href="/personal-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            Политикой обработки персональных данных
          </Link>{" "}
          в соответствии с Федеральным законом № 152-ФЗ.
        </span>
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
