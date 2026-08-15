import { FileText } from "lucide-react";

import { signedAttachmentUrl } from "@/lib/attachment-links";

type StoredAttachment = { url: string; name: string; size: number };

function parse(value: unknown): StoredAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { url, name, size } = item as Record<string, unknown>;
    if (typeof url !== "string" || typeof name !== "string") return [];
    return [{ url, name, size: typeof size === "number" ? size : 0 }];
  });
}

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} МБ`;
}

/**
 * Вложения к заявке: ТЗ, спецификация конкурса, фото шильда.
 * Показываем всегда — «вложений нет» тоже информация для менеджера.
 *
 * Ссылки подписываются при каждой отрисовке страницы и живут 15 минут:
 * файлы лежат в закрытом бакете, потому что содержат ПДн и коммерческие
 * документы клиник. Прямой адрес из базы для них отдаёт «доступ запрещён»,
 * поэтому здесь он не используется (см. lib/attachment-links.ts).
 */
export async function RequestAttachments({ value }: { value: unknown }) {
  const files = parse(value);

  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">Вложений нет</p>;
  }

  const links = await Promise.all(
    files.map(async (file) => ({
      ...file,
      href: await signedAttachmentUrl(file.url, file.name),
    })),
  );

  const broken = links.some((l) => !l.href);

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {links.map((file) => (
          <li key={file.url}>
            {file.href ? (
              <a
                href={file.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-primary hover:underline"
              >
                <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{file.name}</span>
                {file.size ? (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {formatSize(file.size)}
                  </span>
                ) : null}
              </a>
            ) : (
              <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{file.name}</span>
                {file.size ? (
                  <span className="shrink-0 font-mono text-xs">
                    {formatSize(file.size)}
                  </span>
                ) : null}
              </span>
            )}
          </li>
        ))}
      </ul>

      {broken ? (
        <p className="text-xs text-muted-foreground">
          Файл без ссылки — хранилище не отвечает или запись сделана до его
          настройки. Запросите документ у клиента по почте.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Ссылки действуют 15 минут и открываются только из админки — пересылать
          их нельзя. Обновите страницу, если ссылка перестала работать.
        </p>
      )}
    </div>
  );
}
