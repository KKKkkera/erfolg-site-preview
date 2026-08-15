import Link from "next/link";

import { Button } from "@/components/ui/button";

export function RequestsTabs({
  current,
}: {
  current: "quote" | "service" | "contact";
}) {
  const tabs = [
    { id: "quote", label: "КП", href: "/admin/requests/quote" },
    { id: "service", label: "Сервис", href: "/admin/requests/service" },
    { id: "contact", label: "Контакт", href: "/admin/requests/contact" },
  ] as const;
  return (
    <div className="flex flex-wrap gap-2 border-b pb-2">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={
            "rounded-md px-3 py-1.5 text-sm transition-colors " +
            (current === t.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground")
          }
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function RequestStatusFilter({
  base,
  status,
}: {
  base: string;
  status: string;
}) {
  const items = [
    { value: "", label: "Все" },
    { value: "NEW", label: "Новые" },
    { value: "IN_PROGRESS", label: "В работе" },
    { value: "DONE", label: "Завершённые" },
    { value: "REJECTED", label: "Отклонённые" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <Button
          key={i.value || "all"}
          asChild
          size="sm"
          variant={status === i.value ? "default" : "outline"}
        >
          <Link href={i.value ? `${base}?status=${i.value}` : base}>
            {i.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
