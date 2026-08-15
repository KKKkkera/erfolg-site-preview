import { getServerSession } from "next-auth/next";
import type { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "status" пишет updateRequestStatus — раньше фильтр по нему молча не работал.
const ACTIONS = new Set(["create", "update", "delete", "login", "status"]);
const ENTITIES = new Set([
  "Product",
  "Category",
  "Brand",
  "Page",
  "Setting",
  "AdminUser",
  "MediaAsset",
  "ProductImage",
  "QuoteRequest",
  "ServiceRequest",
  "ContactRequest",
]);

function csvEscape(v: unknown): string {
  if (v == null) return "";
  let s = typeof v === "string" ? v : JSON.stringify(v);
  if (/[",\n\r]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (session.user.role !== "OWNER") {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const entity = searchParams.get("entity") || "";
  const adminId = searchParams.get("adminId") || "";

  const where: Prisma.AdminAuditLogWhereInput = {};
  if (action && ACTIONS.has(action)) where.action = action;
  if (entity && ENTITIES.has(entity)) where.entity = entity;
  if (adminId) where.adminId = adminId;

  let logs: Array<{
    createdAt: Date;
    action: string;
    entity: string;
    entityId: string | null;
    adminId: string | null;
    meta: unknown;
    admin: { email: string; name: string } | null;
  }> = [];
  try {
    logs = await db.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: { admin: { select: { email: true, name: true } } },
    });
  } catch (e) {
    console.error("audit export error", e);
    return new Response("DB error", { status: 500 });
  }

  const header = [
    "createdAt",
    "adminEmail",
    "adminName",
    "action",
    "entity",
    "entityId",
    "meta",
  ];
  const rows = logs.map((l) =>
    [
      l.createdAt.toISOString(),
      l.admin?.email ?? "",
      l.admin?.name ?? "",
      l.action,
      l.entity,
      l.entityId ?? "",
      l.meta ? JSON.stringify(l.meta) : "",
    ]
      .map(csvEscape)
      .join(","),
  );
  // BOM для корректной кодировки в Excel
  const csv = "﻿" + [header.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
