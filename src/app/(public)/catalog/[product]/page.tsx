import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Download, ExternalLink, FileText, Info, Truck } from "lucide-react";

import { db } from "@/lib/db";
import { formatRu } from "@/lib/utils-format";
import { hasRealRegNumber } from "@/lib/reg-number";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ContentBlocks } from "@/components/public/content-blocks";
import { ProductCard } from "@/components/public/product-card";
import { RegBadge } from "@/components/public/reg-badge";
import { LeadDialog } from "@/components/public/lead-dialog";
import { JsonLd } from "@/components/seo/json-ld";
import { productMetadata } from "@/lib/seo";
import { breadcrumbListSchema, productSchema } from "@/lib/schema";

export const revalidate = 300;

const KIND_LABEL: Record<string, string> = {
  EQUIPMENT: "Оборудование",
  CONSUMABLE: "Расходник",
  SPARE_PART: "Запчасть",
};

type ProductPageProps = {
  params: Promise<{ product: string }>;
};

async function loadProduct(slug: string) {
  try {
    return await db.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sort: "asc" } },
        specs: { orderBy: { sort: "asc" } },
        files: { orderBy: { sort: "asc" } },
      },
    });
  } catch (e) {
    throw e;
  }
}

const RELATED_TAKE = 3;

const RELATED_INCLUDE = {
  brand: true,
  category: true,
  images: { take: 1, orderBy: { sort: "asc" } },
} as const;

/**
 * Подборка внизу карточки товара: сначала соседи по категории, затем — если
 * их не хватает — остальной каталог. В категории часто лежит один-два товара,
 * и без добора блок почти никогда не показывался.
 */
async function loadRelated(categoryId: string, excludeId: string) {
  try {
    const sameCategory = await db.product.findMany({
      where: { categoryId, status: "ACTIVE", id: { not: excludeId } },
      include: RELATED_INCLUDE,
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      take: RELATED_TAKE,
    });

    if (sameCategory.length >= RELATED_TAKE) return sameCategory;

    const rest = await db.product.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: [excludeId, ...sameCategory.map((p) => p.id)] },
      },
      include: RELATED_INCLUDE,
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      take: RELATED_TAKE - sameCategory.length,
    });

    return [...sameCategory, ...rest];
  } catch (e) {
    console.error("related load error", e);
    return [];
  }
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const params = await props.params;
  const product = await loadProduct(params.product);
  if (!product) {
    return { title: "Товар не найден" };
  }
  return productMetadata(product);
}

export default async function ProductPage(props: ProductPageProps) {
  const params = await props.params;
  const product = await loadProduct(params.product);
  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  // Метка файла вводится в админке по-русски — точное сравнение с "datasheet"
  // не находило ничего.
  const datasheetFile = product.files.find((f) =>
    /datasheet|спецификац|технич/i.test(f.label),
  );
  // Данные о документах и маркировке. Строки, которые администратор не
  // заполнил, не выводим — пустой прочерк в карточке медизделия читается как
  // «документа нет».
  const documentRows: { label: string; value: string }[] = [];
  if (hasRealRegNumber(product.regNumber)) {
    documentRows.push({
      label: "Регистрационное удостоверение",
      value: product.regNumber as string,
    });
    if (product.regDate) {
      documentRows.push({
        label: "Дата выдачи",
        value: formatRu(product.regDate),
      });
    }
    documentRows.push({
      label: "Срок действия",
      value: product.regValidUntil
        ? `до ${formatRu(product.regValidUntil)}`
        : "Бессрочно",
    });
  }
  if (product.regAuthority) {
    documentRows.push({
      label: "Орган, выдавший документ",
      value: product.regAuthority,
    });
  }
  if (product.markingRequired !== null) {
    documentRows.push({
      label: "Маркировка «Честный знак»",
      value: product.markingRequired
        ? "Товар подлежит маркировке"
        : "Товар не подлежит маркировке",
    });
  }
  if (product.markingCodes) {
    documentRows.push({ label: "Коды маркировки", value: product.markingCodes });
  }

  const related = await loadRelated(product.categoryId, product.id);
  const heroImage = product.images[0];
  const heroImageUrl = heroImage?.url || "/placeholder-product.svg";

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/catalog", label: "Каталог" },
          { label: product.name },
        ]}
      />

      <section className="rails container pb-16">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Галерея */}
          <div>
            <div className="relative overflow-hidden rounded-lg border border-border bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
                <span className="tech-label text-muted-foreground">
                  {KIND_LABEL[product.kind] ?? product.kind}
                </span>
                {product.sku ? (
                  <span className="truncate font-mono text-[0.6875rem] text-muted-foreground">
                    SKU: {product.sku}
                  </span>
                ) : null}
              </div>
              <div className="relative aspect-square">
                <Image
                  src={heroImageUrl}
                  alt={heroImage?.alt || product.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-contain p-8"
                  unoptimized={heroImageUrl.endsWith(".svg")}
                  priority
                />
              </div>
            </div>
            {product.images.length > 1 ? (
              <ul className="mt-4 grid grid-cols-4 gap-3">
                {product.images.slice(0, 8).map((img) => (
                  <li
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-md border border-border bg-white"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || product.name}
                      fill
                      sizes="120px"
                      className="object-contain p-2"
                      unoptimized={img.url.endsWith(".svg")}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Инфо */}
          <div className="md:self-start">
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.8rem]">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {product.brand?.name ? (
                  <span className="text-foreground">{product.brand.name}</span>
                ) : null}
                {product.model ? (
                  <span className="normal-case tracking-normal">
                    {product.model}
                  </span>
                ) : null}
              </div>

              {product.shortDesc ? (
                <p className="text-base leading-7 text-muted-foreground">
                  {product.shortDesc}
                </p>
              ) : null}

              <RegBadge product={product} />

              <div className="overflow-hidden rounded-lg border border-border bg-white">
                <div className="border-b border-border bg-surface/70 px-5 py-3">
                  <span className="tech-label text-foreground">
                    Цена по запросу
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Стоимость зависит от комплектации, объёма заказа и условий
                    поставки. КП с ценой и сроком поставки готовим в течение
                    рабочего дня.
                  </p>
                  {/* Срок — второй вопрос после цены, а для конкурса часто
                      первый. Цифры те же, что в FAQ на главной. */}
                  <p className="mt-3 flex items-start gap-2 rounded-md border border-border bg-surface/70 px-3 py-2.5 text-sm leading-6 text-foreground">
                    <Truck className="mt-1 h-4 w-4 shrink-0 text-flame-ink" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold">Срок поставки:</strong>{" "}
                      5–14 рабочих дней со склада в России, от 6 недель для
                      оборудования под заказ. Точный срок фиксируем в КП.
                    </span>
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <LeadDialog
                      productId={product.id}
                      source="product-page"
                      triggerLabel="Получить КП"
                      triggerVariant="accent"
                      triggerSize="lg"
                    />
                    {datasheetFile ? (
                      <Button asChild variant="outline" size="lg">
                        <a
                          href={datasheetFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Скачать спецификацию
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-4 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {/* Полный дисклеймер по 38-ФЗ — ниже на этой же странице.
                        Здесь короткая версия, чтобы не печатать одно и то же
                        дважды на расстоянии экрана. */}
                    <span>Изделие для медицинских организаций.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            {/* max-w-full + прокрутка: на 375px три вкладки не влезали и
                растягивали всю страницу — она ехала вбок на 23px. */}
            <TabsList className="flex max-w-full justify-start overflow-x-auto">
              <TabsTrigger value="description">Описание</TabsTrigger>
              <TabsTrigger value="specs">
                Характеристики
                {product.specs.length > 0 ? ` (${product.specs.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="files">
                Документы
                {product.files.length > 0 ? ` (${product.files.length})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              {product.fullDesc ? (
                /* Описание может содержать стандартные блоки ([[block:…]]),
                   поэтому идёт через ContentBlocks, а не напрямую в innerHTML:
                   HTML-куски санитайзятся так же, как раньше. */
                <ContentBlocks
                  content={product.fullDesc}
                  leadSource={`product-${product.slug}`}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Подробное описание добавляется по мере наполнения каталога.
                  Для уточнения комплектации свяжитесь с менеджером.
                </p>
              )}
            </TabsContent>

            <TabsContent value="specs" className="mt-6">
              {product.specs.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableBody>
                      {product.specs.map((spec) => (
                        <TableRow key={spec.id}>
                          <TableCell className="w-1/3 bg-surface/60 font-medium text-muted-foreground">
                            {spec.key}
                          </TableCell>
                          <TableCell className="font-mono text-[0.8125rem] text-foreground">
                            {spec.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Технические характеристики уточняются в коммерческом предложении.
                </p>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-6 space-y-6">
              {documentRows.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="border-b border-border bg-surface/70 px-4 py-2.5">
                    <span className="tech-label text-foreground">
                      Данные о документах и маркировке
                    </span>
                  </div>
                  <Table>
                    <TableBody>
                      {documentRows.map((row) => (
                        <TableRow key={row.label}>
                          <TableCell className="w-1/3 bg-surface/60 font-medium text-muted-foreground">
                            {row.label}
                          </TableCell>
                          <TableCell className="text-[0.8125rem] text-foreground">
                            {row.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              {product.files.length > 0 ? (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {product.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-4 bg-white px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText
                          className="h-4 w-4 shrink-0 text-flame-ink"
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm text-foreground">
                          {file.label}
                        </span>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Скачать
                          <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Документы предоставляются по запросу. Полный пакет (РУ,
                  инструкция, регистрационная карта) направляется вместе с КП.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Дисклеймер 38-ФЗ «О рекламе» */}
        <Alert className="mt-10 border-warning/40 bg-warning/10 text-foreground [&>svg]:text-warning">
          <Info className="h-5 w-5" aria-hidden="true" />
          <AlertTitle>Информация</AlertTitle>
          <AlertDescription>
            Изделие предназначено для применения медицинскими организациями.
            Имеются противопоказания. Перед использованием ознакомьтесь с
            инструкцией по эксплуатации и проконсультируйтесь со специалистом.
          </AlertDescription>
        </Alert>

        {/* Одна сиротская карточка в пустом ряду выглядит ошибкой, поэтому
            секция появляется только от двух товаров. */}
        {related.length >= 2 ? (
          <div className="mt-16">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Ещё предложения
              </h2>
              <Link
                href={`/catalog?category=${product.category.slug}`}
                className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
              >
                Все из категории
              </Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <JsonLd data={productSchema(product)} />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", url: "/" },
          { name: "Каталог", url: "/catalog" },
          {
            name: product.name,
            url: `/catalog/${product.slug}`,
          },
        ])}
      />
    </>
  );
}
