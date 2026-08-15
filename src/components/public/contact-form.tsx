"use client";

import { useEffect, useRef } from "react";
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
  submitContactRequest,
  type ContactFormState,
} from "@/server/actions/contact-request";
import {
  AttachmentField,
  ConsentField,
} from "@/components/public/quote-request-form";

const initialState: ContactFormState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Отправка…" : "Отправить сообщение"}
    </Button>
  );
}

export function ContactForm() {
  if (FORMS_DISABLED) {
    return <FormsDisabledNotice />;
  }

  return <ContactFormInner />;
}

function ContactFormInner() {
  const [state, formAction] = useFormState(submitContactRequest, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Сообщение отправлено");
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
          Сообщение отправлено
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {state.message ??
            "Мы свяжемся с вами в ближайшее время."}
        </p>
      </div>
    );
  }

  // encType не указываем: для Server Action React сам отправляет
  // multipart/form-data, а явный атрибут он перетирает с предупреждением
  // в консоли.
  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] -top-[9999px] h-0 w-0 opacity-0"
      />
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">
          Сообщение <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder="Расскажите, чем мы можем помочь"
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
                : undefined
        }
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
