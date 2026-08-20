import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";

  if (query.length < 2) {
    return Response.json({ items: [] });
  }

  try {
    const products = await db.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { model: { contains: query, mode: "insensitive" } },
          { shortDesc: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [{ sort: "asc" }, { name: "asc" }],
      take: 7,
      select: {
        id: true,
        slug: true,
        name: true,
        model: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: {
          orderBy: { sort: "asc" },
          take: 1,
          select: { url: true, alt: true },
        },
      },
    });

    return Response.json(
      {
        items: products.map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          model: product.model,
          brand: product.brand?.name ?? null,
          category: product.category.name,
          imageUrl: product.images[0]?.url ?? null,
          imageAlt: product.images[0]?.alt ?? null,
        })),
      },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (error) {
    console.error("catalog search suggestions error", error);
    return Response.json(
      { items: [], error: "Search unavailable" },
      { status: 500 },
    );
  }
}
