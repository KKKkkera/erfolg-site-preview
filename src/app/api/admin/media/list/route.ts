import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/media/list?origin=&q=
 * Возвращает последние 200 MediaAsset.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin") || undefined;

  try {
    const items = await db.mediaAsset.findMany({
      where: origin ? { origin } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        url: true,
        alt: true,
        mime: true,
        size: true,
        width: true,
        height: true,
        origin: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("media list error", e);
    return NextResponse.json({ items: [] });
  }
}
