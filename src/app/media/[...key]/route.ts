import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { S3_BUCKET, isS3Configured, s3 } from "@/lib/s3";

/**
 * Публичная выдача картинок каталога из закрытого хранилища.
 *
 * Зачем маршрут вместо публичного бакета: в бакете лежат и картинки товаров
 * (products/), и вложения к заявкам (requests/) — ТЗ и спецификации клиник с
 * персональными данными. Открой мы бакет на публичное чтение хоть немного
 * шире задуманного — утекли бы и они. Здесь наружу выдаётся ровно один
 * префикс, а всё остальное отвечает 404 независимо от настроек Selectel.
 *
 * Отдаём не сам файл, а перенаправление на временную подписанную ссылку:
 * байты качает Selectel, а не наш сервер, у которого 1,9 ГБ памяти и рядом
 * работает CRM.
 */

/** Единственный префикс, доступный публично. */
const PUBLIC_PREFIX = "products/";

/** Срок жизни подписи. Перенаправление кэшируется чуть меньше — с запасом. */
const SIGNED_TTL_SECONDS = 60 * 60;
const CACHE_SECONDS = SIGNED_TTL_SECONDS - 300;

function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  const { key: segments } = await context.params;
  const key = (segments ?? []).join("/");

  // Пустой ключ, выход за пределы префикса и попытки подняться на уровень
  // выше — всё это 404 без подробностей: подсказывать, что именно не так,
  // тому, кто перебирает адреса, незачем.
  if (!key || key.includes("..") || !key.startsWith(PUBLIC_PREFIX)) {
    return notFound();
  }

  if (!isS3Configured()) {
    return notFound();
  }

  try {
    const signed = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      { expiresIn: SIGNED_TTL_SECONDS },
    );

    return new Response(null, {
      status: 307,
      headers: {
        Location: signed,
        "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
      },
    });
  } catch (e) {
    console.error("[media] не удалось подписать ссылку на картинку:", e);
    return notFound();
  }
}
