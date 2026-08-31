import { ContentBlocks } from "@/components/public/content-blocks";
import { takePreview } from "@/lib/preview-store";

/* Предпросмотр черновика: те же компоненты, что и на сайте.

   Черновик не передаётся в адресе — конструктор кладёт его серверным экшеном
   в буфер и открывает эту страницу с токеном. Роут лежит внутри
   (authenticated), поэтому доступен только администратору. */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Предпросмотр — Эрфольг",
  robots: { index: false, follow: false },
};

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const draft = t ? takePreview(t) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
        <p className="font-medium">Предпросмотр черновика</p>
        <p className="mt-1 text-muted-foreground">
          Так блоки выглядят на сайте. Черновик не сохранён — вернитесь во
          вкладку конструктора и нажмите «Сохранить». Формы заявок здесь
          рабочие, не отправляйте тестовые заявки.
        </p>
      </div>

      {draft ? (
        <div className="rounded-md border bg-white p-6">
          <ContentBlocks
            content={draft.content}
            leadSource={draft.leadSource}
          />
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Черновик не найден или устарел. Откройте предпросмотр заново из
          конструктора.
        </div>
      )}
    </div>
  );
}
