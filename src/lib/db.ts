import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL?.trim());

const databaseUrl = new URL(process.env.DATABASE_URL?.trim() || "postgresql://unconfigured:unconfigured@127.0.0.1:1/unconfigured?connect_timeout=1");
// Keep static build workers and the app from opening Prisma's CPU-based default pools.
if (!databaseUrl.searchParams.has("connection_limit")) databaseUrl.searchParams.set("connection_limit", "3");

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl.toString() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
