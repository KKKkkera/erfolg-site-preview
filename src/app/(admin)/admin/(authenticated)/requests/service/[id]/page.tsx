import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteRequestButton } from "@/components/admin/requests/delete-request-button";
import { RequestStatusSelect } from "@/components/admin/requests/request-status-select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/utils-format";
import { RequestAttachments } from "@/components/admin/request-attachments";

export const dynamic = "force-dynamic";

export const metadata = { title: "Заявка на сервис — Эрфольг" };

export default async function ServiceRequestPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  let req: Awaited<ReturnType<typeof db.serviceRequest.findUnique>> = null;
  try {
    req = await db.serviceRequest.findUnique({ where: { id: params.id } });
  } catch (e) {
    console.error("service request fetch error", e);
  }
  if (!req) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/requests/service"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← К списку заявок
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Заявка на сервис от {req.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Получена {req.createdAt.toLocaleString("ru-RU")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-background p-3 text-sm">
        <span className="font-medium">Статус:</span>
        <RequestStatusSelect
          type="service"
          id={req.id}
          current={req.status as "NEW" | "IN_PROGRESS" | "DONE" | "REJECTED"}
        />
        <div className="ml-auto">
          <DeleteRequestButton type="service" id={req.id} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Контактные данные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Имя" value={req.name} />
            <Row label="Телефон" value={formatPhone(req.phone)} />
            <Row label="Email" value={req.email || "—"} />
            <Row label="Организация" value={req.organization || "—"} />
            <Row label="Согласие 152-ФЗ" value={req.consent ? "Да" : "Нет"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Оборудование</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Название" value={req.equipmentName} />
            <Row label="Производитель" value={req.manufacturer || "—"} />
            <Row label="Модель" value={req.modelName || "—"} />
            <Row label="Серийный номер" value={req.serial || "—"} />
            <Row
              label="Описание проблемы"
              value={
                <span className="block whitespace-pre-wrap">{req.problem}</span>
              }
            />
            <Row
              label="Вложения"
              value={<RequestAttachments value={req.attachments} />}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
