/**
 * JsonLd — рендерит <script type="application/ld+json">.
 * Server Component: data сериализуется на сервере, без хоп-ов в client.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
