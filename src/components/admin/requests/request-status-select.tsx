"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateRequestStatus } from "@/server/actions/admin/requests";

const STATUSES: { value: "NEW" | "IN_PROGRESS" | "DONE" | "REJECTED"; label: string }[] = [
  { value: "NEW", label: "Новая" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "DONE", label: "Завершена" },
  { value: "REJECTED", label: "Отклонена" },
];

export function RequestStatusSelect({
  type,
  id,
  current,
}: {
  type: "quote" | "service" | "contact";
  id: string;
  current: "NEW" | "IN_PROGRESS" | "DONE" | "REJECTED";
}) {
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    const parsed = STATUSES.find((s) => s.value === value);
    if (!parsed) return;
    if (parsed.value === current) return;
    startTransition(async () => {
      const res = await updateRequestStatus(type, id, parsed.value);
      if (res.ok) {
        toast.success("Статус обновлён");
      } else {
        toast.error(res.message || "Не удалось обновить статус");
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
