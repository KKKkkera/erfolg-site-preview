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
import { LeadForm } from "@/components/public/lead-form";

type LeadDialogProps = {
  productId?: string;
  source?: string;
  triggerLabel?: ReactNode;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
  children?: ReactNode;
};

/**
 * Модалка единой формы обратной связи. Открывается всеми CTA сайта —
 * «Получить КП», «Запросить сервис», «Оставить заявку»: форма одна, отличается
 * только `source`, по нему заявки разбираются в админке.
 */
export function LeadDialog({
  productId,
  source = "site",
  triggerLabel = "Оставить заявку",
  triggerVariant,
  triggerSize,
  triggerClassName,
  children,
}: LeadDialogProps) {
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
      <DialogContent className="max-h-[92vh] max-w-[540px] gap-0 overflow-y-auto overscroll-contain p-7 sm:p-10 [&>button]:right-6 [&>button]:top-6 [&>button]:opacity-35 [&>button:hover]:opacity-70 [&>button>svg]:h-5 [&>button>svg]:w-5">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="font-heading text-[26px] font-bold leading-tight text-foreground sm:text-[32px]">
            Оставьте заявку
          </DialogTitle>
          <DialogDescription className="mx-auto max-w-[340px] text-sm text-foreground">
            Менеджер свяжется с вами в ближайшее время
          </DialogDescription>
        </DialogHeader>
        <div className="mt-7">
          <LeadForm productId={productId} source={source} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
