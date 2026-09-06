import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { db } from "@/lib/db";

// Only trust headers when the reverse proxy overwrites them (see README).
export function requestIp(h: Pick<Headers, "get">): string | null {
  if (process.env.TRUST_PROXY !== "true") return null;
  const value = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  return isIP(value) ? value : null;
}

export async function allowRequest(scope: string, identity: string, limit: number, windowMs: number): Promise<boolean> {
  const key = "internal.rate-limit:" + createHash("sha256").update(`${scope}:${identity}`).digest("hex");
  const now = new Date();
  const nowMs = now.getTime();
  const expiresAt = nowMs + windowMs;
  // Atomic increment: parallel requests and separate workers share one limit.
  const rows = await db.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "settings" ("key", "value", "updatedAt")
    VALUES (${key}, jsonb_build_object('count', 1, 'expiresAt', ${expiresAt}::bigint), ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "value" = CASE WHEN ("settings"."value"->>'expiresAt')::bigint <= ${nowMs}
        THEN jsonb_build_object('count', 1, 'expiresAt', ${expiresAt}::bigint)
        ELSE jsonb_set("settings"."value", '{count}', to_jsonb(LEAST(("settings"."value"->>'count')::integer + 1, ${limit + 1}))) END,
      "updatedAt" = ${now}
    RETURNING ("value"->>'count')::integer AS "count"
  `;
  await db.setting.deleteMany({ where: { key: { startsWith: "internal.rate-limit:" }, updatedAt: { lt: new Date(nowMs - 86_400_000) } } });
  return rows[0].count <= limit;
}
