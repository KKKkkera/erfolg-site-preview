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
import { ServiceRequestForm } from "@/components/public/service-request-form";

type ServiceRequestDialogProps = {
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
  children?: ReactNode;
};

/**
 * Диалог заявки на сервис.
 *
 * Заведён отдельно от QuoteRequestDialog: раньше кнопка «заявка на сервис»
 * на главной открывала форму КП, и заявка на ремонт уходила в очередь
 * коммерческих предложений без модели, серийного номера и описания
 * неисправности.
 */
export function ServiceRequestDialog({
  triggerLabel = "Запросить сервис",
  triggerVariant,
  triggerSize,
  triggerClassName,
  children,
}: ServiceRequestDialogProps) {
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
          <DialogTitle className="font-heading">Заявка на сервис</DialogTitle>
          <DialogDescription>
            Укажите модель, серийный номер и характер неисправности. Можно
            приложить фото идентификационной таблички — этого достаточно для
            первичной диагностики.
          </DialogDescription>
        </DialogHeader>
        <ServiceRequestForm />
      </DialogContent>
    </Dialog>
  );
}
