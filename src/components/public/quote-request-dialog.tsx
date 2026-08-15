"use client";

import { useState, type ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuoteRequestForm } from "@/components/public/quote-request-form";

type QuoteRequestDialogProps = {
  productId?: string;
  source?: string;
  triggerLabel?: ReactNode;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
  children?: ReactNode;
};

/**
 * Обёртка над shadcn Dialog для формы «Получить КП».
 * Можно использовать как с собственным триггером (children), так и с дефолтной кнопкой.
 */
export function QuoteRequestDialog({
  productId,
  source = "site",
  triggerLabel = "Получить КП",
  triggerVariant,
  triggerSize,
  triggerClassName,
  children,
}: QuoteRequestDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
          >
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Опишите задачу — подготовим расчёт
          </DialogTitle>
          <DialogDescription>
            Подойдёт техническое задание, спецификация конкурса, фото
            идентификационной таблички или краткое описание потребности.
            Ответим в рабочий день.
          </DialogDescription>
        </DialogHeader>
        <QuoteRequestForm productId={productId} source={source} compact />
      </DialogContent>
    </Dialog>
  );
}
