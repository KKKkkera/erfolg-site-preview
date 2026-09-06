"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const MASK = "+7 (000) 000-00-00";
const NATIONAL_LENGTH = 10;

/** Собирает маску по введённым цифрам: `0` в шаблоне заменяется цифрой. */
function format(digits: string): string {
  if (!digits) return "";
  let out = "";
  let i = 0;
  for (const ch of MASK) {
    if (ch === "0") {
      if (i >= digits.length) break;
      out += digits[i];
      i += 1;
    } else {
      out += ch;
    }
  }
  // Хвостовые скобки и дефисы обрезаем: иначе backspace упирается в них
  // и последнюю цифру стереть нельзя.
  return out.replace(/[^\d]+$/, "");
}

/**
 * Телефон только по России: поле принимает исключительно цифры, всё остальное
 * (пробелы, буквы, вставленный текст) отбрасывается на вводе, длина ограничена
 * маской. Междугородные «8» и «+7» в начале срезаются — иначе номер уезжал
 * на сервер с задвоенным кодом.
 */
export function PhoneInput({
  name = "phone",
  required = false,
  invalid = false,
  className,
}: {
  name?: string;
  required?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const [digits, setDigits] = useState("");

  return (
    <input
      name={name}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      required={required}
      aria-label="Ваш телефон"
      placeholder={MASK}
      aria-invalid={invalid || undefined}
      value={format(digits)}
      onChange={(event) => {
        let raw = event.target.value.replace(/\D/g, "");
        // Код срезаем только у полного номера: у кодов городов (812, 843)
        // ведущая восьмёрка — часть самого номера.
        if (raw.length > NATIONAL_LENGTH && /^[78]/.test(raw)) raw = raw.slice(1);
        setDigits(raw.slice(0, NATIONAL_LENGTH));
      }}
      onKeyDown={(event) => {
        // Блокируем «e», «+», «-» и прочие символы, которые input[type=tel]
        // пропускает: значение всё равно отфильтруется, но так поле
        // не мигает лишним символом.
        if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !/\d/.test(event.key)
        ) {
          event.preventDefault();
        }
      }}
      className={cn(
        "h-[3.375rem] w-full border bg-white px-5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary sm:text-sm",
        invalid ? "border-destructive" : "border-border",
        className,
      )}
    />
  );
}
