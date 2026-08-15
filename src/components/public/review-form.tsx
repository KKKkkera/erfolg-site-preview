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
import { submitReview, type ReviewFormState } from "@/server/actions/review";

const initialState: ReviewFormState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Отправка…" : "Отправить отзыв"}
    </Button>
  );
}

export function ReviewForm() {
  if (FORMS_DISABLED) {
    return <FormsDisabledNotice />;
  }
  return <ReviewFormInner />;
}

function ReviewFormInner() {
  const [state, formAction] = useFormState(submitReview, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Отзыв отправлен");
      formRef.current?.reset();
    } else if (state.message && !state.errors) {
      toast.error(state.message);
    }
  }, [state]);

  if (state.ok) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
        <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
          Отзыв отправлен
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {state.message ??
            "Опубликуем после проверки. Если потребуется уточнение, свяжемся по контактам, которые вы оставили."}
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
        <div className="space-y-1.5">
          <Label htmlFor="authorName">
            Имя или псевдоним
            <span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="authorName"
            name="authorName"
            required
            placeholder="Как подписать отзыв"
          />
          {state.errors?.authorName ? (
            <p className="text-xs text-destructive">{state.errors.authorName}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">
            Город
            <span className="ml-1 text-xs text-muted-foreground">(необязательно)</span>
          </Label>
          <Input id="city" name="city" placeholder="Например: Владикавказ" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="organization">
          Организация
          <span className="ml-1 text-xs text-muted-foreground">(необязательно)</span>
        </Label>
        <Input id="organization" name="organization" placeholder="ГБУЗ / ООО / клиника" />
        <label className="flex items-start gap-2 pt-1 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="showOrganization"
            className="mt-1 h-4 w-4 rounded border-border accent-primary"
          />
          <span>Публиковать название организации рядом с отзывом</span>
        </label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="text">
          Отзыв
          <span className="ml-0.5 text-destructive">*</span>
        </Label>
        <Textarea
          id="text"
          name="text"
          rows={6}
          required
          placeholder="Что поставляли или обслуживали, как прошло, что было важно."
        />
        {state.errors?.text ? (
          <p className="text-xs text-destructive">{state.errors.text}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="attachments">
          Фото или видео
          <span className="ml-1 text-xs text-muted-foreground">(необязательно)</span>
        </Label>
        <Input
          id="attachments"
          name="attachments"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.heic,.mp4,.mov"
          className="h-auto cursor-pointer py-2 file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          JPG, PNG, MP4. До 5 файлов, каждый не больше 25 МБ.
        </p>
        {state.errors?.attachments ? (
          <p className="text-xs text-destructive">{state.errors.attachments}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail">
            Email для связи
            <span className="ml-1 text-xs text-muted-foreground">(необязательно)</span>
          </Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            placeholder="example@company.ru"
          />
          {state.errors?.contactEmail ? (
            <p className="text-xs text-destructive">{state.errors.contactEmail}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">
            Телефон для связи
            <span className="ml-1 text-xs text-muted-foreground">(необязательно)</span>
          </Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            placeholder="+7 (___) ___-__-__"
          />
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Контакты нужны только для уточнений перед публикацией. На сайте они
        не показываются.
      </p>

      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm text-foreground">
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
              href="/review-consent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              согласие на публикацию отзыва и персональных данных
            </Link>{" "}
            и подтверждаю, что указанные сведения предоставлены добровольно.
          </span>
        </label>
        {state.errors?.consent ? (
          <p className="text-xs text-destructive">{state.errors.consent}</p>
        ) : null}
      </div>

      {state.message && state.errors ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
