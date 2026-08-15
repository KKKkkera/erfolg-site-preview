import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { requestUpload } from "@/server/actions/admin/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/media/upload
 * Тело: { filename, mime, size }
 * Возвращает: { uploadUrl, key, publicUrl } (presigned PUT URL Selectel S3)
 *
 * Альтернатива Server Action для удобной XHR-загрузки от клиента.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { filename, mime, size } = body as {
    filename?: unknown;
    mime?: unknown;
    size?: unknown;
  };
  if (
    typeof filename !== "string" ||
    typeof mime !== "string" ||
    (typeof size !== "number" && typeof size !== "string")
  ) {
    return NextResponse.json(
      { error: "Поля filename/mime/size обязательны" },
      { status: 400 },
    );
  }

  const result = await requestUpload({
    filename,
    mime,
    size: Number(size),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  return NextResponse.json(result);
}
