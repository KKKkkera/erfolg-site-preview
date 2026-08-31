-- CreateTable
CREATE TABLE "region_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "heading" TEXT,
    "intro" TEXT,
    "content" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "region_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "region_pages_slug_key" ON "region_pages"("slug");
