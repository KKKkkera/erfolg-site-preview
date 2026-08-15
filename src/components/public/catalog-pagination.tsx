import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CatalogPaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | string[] | undefined>;
};

function buildHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
  page: number,
) {
  const sp = new URLSearchParams();
  if (searchParams) {
    for (const [key, val] of Object.entries(searchParams)) {
      if (key === "page" || val === undefined) continue;
      if (Array.isArray(val)) {
        for (const v of val) sp.append(key, v);
      } else {
        sp.set(key, val);
      }
    }
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function CatalogPagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  const window = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - window && p <= page + window)
    ) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <Pagination className="mt-10">
      <PaginationContent>
        {page > 1 ? (
          <PaginationItem>
            <Link
              href={buildHref(basePath, searchParams, page - 1)}
              aria-label="Предыдущая страница"
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 pl-2.5",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Назад</span>
            </Link>
          </PaginationItem>
        ) : null}

        {pages.map((p, idx) =>
          p === "…" ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <Link
                href={buildHref(basePath, searchParams, p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  buttonVariants({
                    variant: p === page ? "outline" : "ghost",
                    size: "icon",
                  }),
                )}
              >
                {p}
              </Link>
            </PaginationItem>
          ),
        )}

        {page < totalPages ? (
          <PaginationItem>
            <Link
              href={buildHref(basePath, searchParams, page + 1)}
              aria-label="Следующая страница"
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "gap-1 pr-2.5",
              )}
            >
              <span>Вперёд</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  );
}
