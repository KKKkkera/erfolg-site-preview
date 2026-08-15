import Link from "next/link";

import { BrandForm } from "@/components/admin/brands/brand-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Новый бренд — Эрфольг" };

export default function NewBrandPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/brands"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← К списку брендов
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Новый бренд
        </h1>
      </div>
      <BrandForm mode="create" />
    </div>
  );
}
