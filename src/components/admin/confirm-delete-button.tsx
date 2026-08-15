"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ConfirmDeleteButton({
  id,
  label = "Удалить",
  description = "Действие нельзя отменить.",
  onDelete,
  size = "sm",
  variant = "ghost",
  iconOnly = false,
}: {
  id: string;
  label?: string;
  description?: string;
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>;
  size?: "sm" | "icon" | "default";
  variant?: "ghost" | "destructive" | "outline";
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const res = await onDelete(id);
      if (res.ok) {
        toast.success("Удалено");
        setOpen(false);
      } else {
        toast.error(res.message || "Не удалось удалить");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size === "icon" ? "icon" : size}
          className={
            variant === "destructive"
              ? ""
              : "text-muted-foreground hover:text-destructive"
          }
        >
          <Trash2 className="h-4 w-4" />
          {!iconOnly ? <span className="ml-2">{label}</span> : null}
          <span className="sr-only">{label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить запись?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? "Удаление…" : "Удалить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
